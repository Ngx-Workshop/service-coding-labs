import { HttpException, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const requestContext = new AsyncLocalStorage<{ requestId: string }>();
const operationFailures = new AsyncLocalStorage<Set<unknown>>();

type DomainEvent =
  | 'lab_draft_created'
  | 'lab_draft_updated'
  | 'lab_published'
  | 'challenge_verification';

type VerificationSummary = {
  passed: boolean;
  totalTests: number;
  passedTests: number;
};

type RunnerFailureDetails = {
  runnerFailure?: 'spawn' | 'container_start';
  exitCode?: 125 | 126 | 127;
};

export async function observeDomainOperation<T>(
  logger: Pick<Logger, 'log' | 'warn' | 'error'>,
  event: DomainEvent,
  work: () => Promise<T>,
  summarize?: (result: T) => VerificationSummary,
  failureDetails?: (error: unknown) => RunnerFailureDetails
): Promise<T> {
  const failures = operationFailures.getStore() ?? new Set<unknown>();
  return operationFailures.run(failures, async () => {
    const started = process.hrtime.bigint();
    const operationId = randomUUID();
    const base = {
      event,
      requestId: requestContext.getStore()?.requestId,
      ...(event === 'challenge_verification'
        ? { runId: operationId }
        : { operationId }),
    };
    const durationMs = () =>
      Math.round(Number(process.hrtime.bigint() - started) / 1e6);
    try {
      const result = await work();
      const summary = summarize?.(result);
      const entry = {
        ...base,
        outcome: summary?.passed === false ? 'failed' : 'success',
        durationMs: durationMs(),
        ...(summary
          ? { totalTests: summary.totalTests, passedTests: summary.passedTests }
          : {}),
      };
      if (summary?.passed === false) logger.warn(entry);
      else logger.log(entry);
      return result;
    } catch (error) {
      // A nested runner already recorded this failure; HTTP access remains separate.
      if (failures.has(error)) throw error;
      failures.add(error);
      const statusCode =
        error instanceof HttpException ? error.getStatus() : 500;
      const entry = {
        ...base,
        outcome: statusCode < 500 ? 'rejected' : 'failure',
        durationMs: durationMs(),
        statusCode,
        ...failureDetails?.(error),
      };
      if (statusCode < 500) logger.warn(entry);
      else logger.error(entry);
      throw error;
    }
  });
}
