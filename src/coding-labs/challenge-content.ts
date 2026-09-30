import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { LabIOTestCase, LabTestCase } from '../collection-interfaces';
import { HandsOnLabVersionMongo } from './schemas/hands_on_lab_versions.schema';

export function contentHash(v: Partial<HandsOnLabVersionMongo>): string {
  const canonical = (value: unknown): unknown => {
    if (value && typeof value === 'object' && 'toJSON' in value)
      value = (value as { toJSON(): unknown }).toJSON();
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, item]) => [key, canonical(item)])
      );
    return value;
  };
  return createHash('sha256')
    .update(
      JSON.stringify(
        canonical([
          v.language,
          v.promptMarkdown,
          v.hints ?? [],
          v.starterCode,
          v.referenceSolution ?? null,
          v.sampleTests ?? [],
          v.hiddenTests ?? [],
          v.runner,
        ])
      )
    )
    .digest('hex');
}

export function validateChallenge(v: Partial<HandsOnLabVersionMongo>): void {
  for (const [label, value] of Object.entries({
    Statement: v.promptMarkdown,
    'Starter code': v.starterCode,
    'Reference solution': v.referenceSolution?.code,
  })) {
    if (!value?.trim())
      throw new BadRequestException(
        `${label} is required for verification and publishing`
      );
  }
  if (!['javascript', 'typescript'].includes(v.language ?? ''))
    throw new BadRequestException('Unsupported language');
  if (!/^[a-zA-Z_$][\w$]*$/.test(v.runner?.entryFnName ?? ''))
    throw new BadRequestException(
      'Entry function must be a JavaScript identifier'
    );
  if (
    !Number.isInteger(v.runner?.timeoutMs) ||
    v.runner!.timeoutMs < 100 ||
    v.runner!.timeoutMs > 10000
  ) {
    throw new BadRequestException('Timeout must be between 100 and 10000 ms');
  }
  if (!v.sampleTests?.length || !v.hiddenTests?.length)
    throw new BadRequestException(
      'At least one sample and one hidden test are required'
    );
  const tests = [...v.sampleTests, ...v.hiddenTests];
  if (tests.length > 50)
    throw new BadRequestException('At most 50 tests are supported');
  const names = new Set<string>();
  for (const test of tests) {
    if (!test.name.trim() || names.has(test.name.trim()))
      throw new BadRequestException('Test names must be nonblank and unique');
    names.add(test.name.trim());
    if (test.kind !== 'io')
      throw new BadRequestException(
        'Convert legacy unit tests to input/output tests before verification'
      );
    if (test.input === undefined || test.expected === undefined)
      throw new BadRequestException(
        `Test "${test.name}" needs input and expected JSON`
      );
    if (
      ![
        'deepEqual',
        'strictEqual',
        'numberTolerance',
        'stringNormalized',
      ].includes(test.comparator?.kind)
    ) {
      throw new BadRequestException(
        `Test "${test.name}" uses an unsupported comparator`
      );
    }
    if (
      test.comparator.kind === 'numberTolerance' &&
      (!Number.isFinite(test.comparator.tolerance) ||
        test.comparator.tolerance! < 0 ||
        typeof test.expected !== 'number')
    )
      throw new BadRequestException(
        'Number tolerance needs a nonnegative tolerance and numeric expected value'
      );
    if (
      test.comparator.kind === 'stringNormalized' &&
      typeof test.expected !== 'string'
    )
      throw new BadRequestException(
        'String comparison needs a string expected value'
      );
    if (
      test.comparator.kind === 'strictEqual' &&
      test.expected !== null &&
      typeof test.expected === 'object'
    )
      throw new BadRequestException('Use deepEqual for arrays and objects');
  }
}

export function compareOutput(actual: unknown, test: LabIOTestCase): boolean {
  const { expected, comparator: c } = test;
  switch (c.kind) {
    case 'deepEqual':
      return isDeepStrictEqual(actual, expected);
    case 'strictEqual':
      return actual === expected;
    case 'numberTolerance':
      return (
        typeof actual === 'number' &&
        typeof expected === 'number' &&
        Number.isFinite(actual) &&
        Math.abs(actual - expected) <= (c.tolerance ?? 0)
      );
    case 'stringNormalized': {
      if (typeof actual !== 'string' || typeof expected !== 'string')
        return false;
      const normalize = (value: string) => {
        if (c.normalizeWhitespace) value = value.trim().replace(/\s+/g, ' ');
        return c.ignoreCase ? value.toLowerCase() : value;
      };
      return normalize(actual) === normalize(expected);
    }
    default:
      return false;
  }
}

export const initialContent = {
  language: 'typescript' as const,
  promptMarkdown:
    '# Sum an array\n\nReturn the sum of the numbers in the input array.\n\n## Examples\nInput: [1, 2, 3]\nOutput: 6\n\n## Constraints\nThe input contains finite integers. An empty array returns 0.',
  starterCode:
    'function solve(input: number[]): number {\n  // Write your solution here.\n  throw new Error("Not implemented");\n}',
  hints: ['Think about the initial value for an empty array.'],
  sampleTests: [
    {
      name: 'Positive numbers',
      kind: 'io',
      input: [1, 2, 3],
      expected: 6,
      comparator: { kind: 'deepEqual' },
    },
  ] as LabTestCase[],
  hiddenTests: [
    {
      name: 'Empty array',
      kind: 'io',
      input: [],
      expected: 0,
      comparator: { kind: 'deepEqual' },
    },
  ] as LabTestCase[],
  runner: { timeoutMs: 2000, memoryMb: 128, entryFnName: 'solve' },
};
