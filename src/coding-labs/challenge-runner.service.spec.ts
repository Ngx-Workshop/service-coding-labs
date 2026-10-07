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
    jest.mocked(spawn).mockReturnValue(
      child as unknown as ReturnType<typeof spawn>
    );
    log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([125, 126, 127])(
    'logs Docker stderr for exit %s while keeping the HTTP error generic',
    async (code) => {
      const pending = new ChallengeRunnerService().verify(version);
      const failure = expect(pending).rejects.toThrow(
        'Docker runner could not start. Check Docker and pull RUNNER_IMAGE.'
      );
      child.stderr.write('Cannot connect to the Docker daemon');
      child.emit('close', code);
      await failure;
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('Cannot connect to the Docker daemon')
      );
      expect(log).toHaveBeenCalledWith(expect.stringContaining(`exit=${code}`));
    }
  );

  it('logs a missing CLI and returns service unavailable', async () => {
    const pending = new ChallengeRunnerService().verify(version);
    const failure = expect(pending).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    child.emit('error', new Error('spawn docker ENOENT'));
    await failure;
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('spawn docker ENOENT')
    );
  });
});
