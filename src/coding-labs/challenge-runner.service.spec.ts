import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { ChallengeRunnerService } from './challenge-runner.service';
import { initialContent } from './challenge-content';
import { HandsOnLabVersionMongo } from './schemas/hands_on_lab_versions.schema';

jest.mock('node:child_process', () => ({ spawn: jest.fn() }));

describe('ChallengeRunnerService infrastructure diagnostics', () => {
  let child: EventEmitter & {
    stdin: PassThrough;
    stdout: PassThrough;
    stderr: PassThrough;
  };
  let log: jest.SpyInstance;
  const version = {
    ...initialContent,
    referenceSolution: {
      code: 'function solve(input) { return input.reduce((sum, n) => sum + n, 0); }',
    },
  } as HandsOnLabVersionMongo;

  beforeEach(() => {
    child = Object.assign(new EventEmitter(), {
      stdin: new PassThrough(),
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });
    jest
      .mocked(spawn)
      .mockReturnValue(child as unknown as ReturnType<typeof spawn>);
    log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([125, 126, 127])(
    'logs a safe suite failure for Docker exit %s while keeping the HTTP error generic',
    async (code) => {
      const pending = new ChallengeRunnerService().verify(version);
      const failure = expect(pending).rejects.toThrow(
        'Docker runner could not start. Check Docker and pull RUNNER_IMAGE.'
      );
      child.stderr.write(
        'private-canary Docker credentials and submitted code'
      );
      child.emit('close', code);
      await failure;
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'challenge_verification',
          outcome: 'failure',
          statusCode: 503,
          runId: expect.any(String) as unknown,
          runnerFailure: 'container_start',
          exitCode: code,
        })
      );
      expect(JSON.stringify(log.mock.calls)).not.toContain('private-canary');
    }
  );

  it('logs a missing CLI and returns service unavailable', async () => {
    const pending = new ChallengeRunnerService().verify(version);
    const failure = expect(pending).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    child.emit('error', new Error('private-canary spawn docker ENOENT'));
    await failure;
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'failure', statusCode: 503 })
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-canary');
  });

  it('logs one safe successful summary for an entire suite, not individual cases', async () => {
    const success = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => {});
    const expected = [...version.sampleTests, ...version.hiddenTests].map(
      (test) => (test.kind === 'io' ? test.expected : undefined)
    );
    jest.mocked(spawn).mockImplementation(() => {
      const execution = Object.assign(new EventEmitter(), {
        stdin: new PassThrough(),
        stdout: new PassThrough(),
        stderr: new PassThrough(),
      });
      setImmediate(() => {
        execution.stdout.write(JSON.stringify({ actual: expected.shift() }));
        execution.emit('close', 0);
      });
      return execution as unknown as ReturnType<typeof spawn>;
    });
    const result = await new ChallengeRunnerService().verify({
      ...version,
      referenceSolution: {
        code: version.referenceSolution!.code + '\n// private-canary',
      },
    });
    expect(result.passed).toBe(true);
    expect(success).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'challenge_verification',
        outcome: 'success',
        totalTests: 2,
        passedTests: 2,
      })
    );
    expect(JSON.stringify(success.mock.calls)).not.toContain('private-canary');
    expect(log).not.toHaveBeenCalled();
  });
});
