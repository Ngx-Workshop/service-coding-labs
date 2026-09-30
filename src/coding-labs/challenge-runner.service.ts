import {
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as ts from 'typescript';
import {
  compareOutput,
  contentHash,
  validateChallenge,
} from './challenge-content';
import { HandsOnLabVersionMongo } from './schemas/hands_on_lab_versions.schema';
import { TestResultDto, VerificationDto } from './dto/verification.dto';

// This harness runs ONLY inside a constrained container. vm is a convenience
// for function lookup and synchronous timeouts, never the isolation boundary.
const HARNESS = `
const vm = require('node:vm');
let body = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => body += chunk);
process.stdin.on('end', async () => {
  const keepAlive = setInterval(() => {}, 1000);
  try {
    const p = JSON.parse(body);
    const context = vm.createContext(Object.create(null));
    const program = 'const exports = {}; const module = {exports};\\n' + p.code +
      '\\n; (typeof ' + p.entry + ' === "function" ? ' + p.entry + ' : module.exports[' + JSON.stringify(p.entry) + '])(' + JSON.stringify(p.input) + ')';
    const value = await new vm.Script(program).runInContext(context, {timeout:p.timeoutMs});
    const json = JSON.stringify(value, (_key, item) => {
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol' || (typeof item === 'number' && !Number.isFinite(item))) throw new Error('Return a finite JSON value');
      return item;
    });
    if (json === undefined) throw new Error('Return a JSON value; received undefined');
    if (json.length > 60000) throw new Error('Result exceeds 60 KB');
    process.stdout.write(JSON.stringify({actual:JSON.parse(json)}));
  } catch (error) {
    process.stdout.write(JSON.stringify({error:String(error.message).slice(0,1000), timeout:error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT'}));
  } finally { clearInterval(keepAlive); }
});`;

@Injectable()
export class ChallengeRunnerService {
  private active = 0;

  async verify(version: HandsOnLabVersionMongo): Promise<VerificationDto> {
    validateChallenge(version);
    if (this.active >= 2)
      throw new HttpException('Verification is busy. Try again shortly.', 429);
    const source = version.referenceSolution!.code;
    if (source.length > 50000)
      throw new BadRequestException(
        'Reference solution exceeds 50,000 characters'
      );
    const compiled = ts.transpileModule(source, {
      fileName:
        version.language === 'typescript' ? 'solution.ts' : 'solution.js',
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
      reportDiagnostics: true,
    });
    const diagnostic = compiled.diagnostics?.find(
      (d) => d.category === ts.DiagnosticCategory.Error
    );
    if (diagnostic)
      throw new BadRequestException(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      );
    this.active++;
    const started = Date.now();
    try {
      const results: TestResultDto[] = [];
      for (const [suite, cases] of [
        ['sample', version.sampleTests],
        ['hidden', version.hiddenTests],
      ] as const) {
        for (const test of cases) {
          if (test.kind !== 'io') continue; // validateChallenge rejects this first.
          const elapsed = Date.now() - started;
          if (elapsed >= 60000) {
            results.push({
              name: test.name,
              suite,
              status: 'timeout',
              durationMs: 0,
              message: 'Suite exceeded 60 seconds',
            });
            continue;
          }
          const start = Date.now();
          const execution = await this.execute(
            {
              code: compiled.outputText,
              entry: version.runner.entryFnName!,
              input: test.input,
              timeoutMs: version.runner.timeoutMs,
            },
            Math.min(version.runner.timeoutMs + 2500, 60000 - elapsed),
            version.runner.memoryMb ?? 128
          );
          const status = execution.timeout
            ? 'timeout'
            : execution.error
              ? 'error'
              : compareOutput(execution.actual, test)
                ? 'passed'
                : 'failed';
          results.push({
            name: test.name,
            suite,
            status,
            durationMs: Date.now() - start,
            actual: execution.actual,
            expected: test.expected,
            message: execution.error,
          });
        }
      }
      const passedTests = results.filter((r) => r.status === 'passed').length;
      return {
        passed: passedTests === results.length,
        contentHash: contentHash(version),
        totalTests: results.length,
        passedTests,
        durationMs: Date.now() - started,
        results,
      };
    } finally {
      this.active--;
    }
  }

  private execute(
    payload: { code: string; entry: string; input: unknown; timeoutMs: number },
    wallMs: number,
    memoryMb: number
  ): Promise<{ actual?: unknown; error?: string; timeout?: boolean }> {
    if (!Number.isInteger(memoryMb) || memoryMb < 64 || memoryMb > 512)
      throw new BadRequestException('Memory must be between 64 and 512 MB');
    const name = `coding-labs-${randomUUID()}`;
    const context = process.env.RUNNER_DOCKER_CONTEXT;
    const prefix = context ? ['--context', context] : [];
    const image = process.env.RUNNER_IMAGE ?? 'node:22-alpine';
    return new Promise((resolve, reject) => {
      const child = spawn(
        'docker',
        [
          ...prefix,
          'run',
          '--rm',
          '--pull=never',
          '-i',
          '--name',
          name,
          '--network=none',
          '--read-only',
          '--user=65534:65534',
          '--cap-drop=ALL',
          '--security-opt=no-new-privileges',
          '--pids-limit=32',
          '--cpus=0.5',
          `--memory=${memoryMb}m`,
          `--memory-swap=${memoryMb}m`,
          '--log-driver=none',
          image,
          'node',
          '--max-old-space-size=' + Math.max(16, memoryMb - 32),
          '-e',
          HARNESS,
        ],
        { stdio: ['pipe', 'pipe', 'pipe'] }
      );
      let stdout = '';
      let stderr = '';
      let bytes = 0;
      let stopped = false;
      const cleanup = () => {
        const remove = spawn('docker', [...prefix, 'rm', '-f', name], {
          stdio: 'ignore',
        });
        remove.on('error', () => {});
        const kill = setTimeout(() => remove.kill('SIGKILL'), 3000);
        remove.on('close', () => clearTimeout(kill));
      };
      const stop = (timeout: boolean) => {
        if (stopped) return;
        stopped = true;
        child.kill('SIGKILL');
        cleanup();
        resolve({
          error: timeout
            ? 'Execution timed out'
            : 'Execution output exceeds 64 KB',
          timeout,
        });
      };
      const timer = setTimeout(() => stop(true), wallMs);
      const consume = (data: Buffer, error: boolean) => {
        bytes += data.length;
        if (bytes > 65536) {
          stop(false);
          return;
        }
        if (error) stderr += data.toString();
        else stdout += data.toString();
      };
      child.stdout.on('data', (data) => consume(data, false));
      child.stderr.on('data', (data) => consume(data, true));
      child.stdin.on('error', () => {});
      child.on('error', () => {
        clearTimeout(timer);
        stopped = true;
        reject(
          new ServiceUnavailableException(
            'Docker runner is unavailable. Start Docker and prepare RUNNER_IMAGE.'
          )
        );
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (stopped) {
          cleanup();
          return;
        }
        stopped = true;
        if (code === 125 || code === 126 || code === 127) {
          reject(
            new ServiceUnavailableException(
              'Docker runner could not start. Check Docker and pull RUNNER_IMAGE.'
            )
          );
          return;
        }
        if (code !== 0) {
          resolve({
            error:
              code === 137
                ? 'Memory limit exceeded'
                : stderr.trim().slice(0, 1000) || 'Execution failed',
          });
          return;
        }
        try {
          const value = JSON.parse(stdout);
          if (
            !value ||
            typeof value !== 'object' ||
            (!('actual' in value) && typeof value.error !== 'string')
          )
            throw new Error();
          resolve(value);
        } catch {
          resolve({ error: 'Runner returned an invalid result' });
        }
      });
      child.stdin.end(JSON.stringify(payload));
    });
  }
}
