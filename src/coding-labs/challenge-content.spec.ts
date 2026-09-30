import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  compareOutput,
  contentHash,
  initialContent,
  validateChallenge,
} from './challenge-content';
import { CreateDraftVersionDto } from './dto/create-draft-version.dto';
import { LabIOTestCase } from '../collection-interfaces';

describe('challenge content', () => {
  const testCase = (expected: unknown, kind = 'deepEqual', extra = {}) =>
    ({
      _id: 'case',
      name: 'case',
      kind: 'io',
      input: null,
      expected,
      comparator: { kind, ...extra },
    }) as LabIOTestCase;

  it.each([null, 0, false, 'answer', [1, 2], { a: 1 }])(
    'accepts JSON value %p through nested DTO validation',
    async (value) => {
      const dto = plainToInstance(CreateDraftVersionDto, {
        createdBy: 'admin',
        sampleTests: [testCase(value)],
      });
      expect(
        await validate(dto, { whitelist: true, forbidNonWhitelisted: true })
      ).toEqual([]);
    }
  );
  it('rejects a missing input without rejecting null', async () => {
    const test = testCase(null);
    delete (test as any).input;
    const dto = plainToInstance(CreateDraftVersionDto, {
      createdBy: 'admin',
      sampleTests: [test],
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
  it('accepts fractional tolerance and rejects negative tolerance', async () => {
    for (const [tolerance, valid] of [
      [0.001, true],
      [-0.1, false],
    ] as const) {
      const dto = plainToInstance(CreateDraftVersionDto, {
        createdBy: 'a',
        sampleTests: [testCase(1, 'numberTolerance', { tolerance })],
      });
      expect((await validate(dto)).length === 0).toBe(valid);
    }
  });
  it('compares deep objects independent of key order but preserves array order', () => {
    expect(compareOutput({ b: 2, a: 1 }, testCase({ a: 1, b: 2 }))).toBe(true);
    expect(compareOutput([2, 1], testCase([1, 2]))).toBe(false);
    expect(compareOutput(null, testCase(null))).toBe(true);
  });
  it('uses numeric tolerance and explicit string normalization', () => {
    expect(
      compareOutput(1.001, testCase(1, 'numberTolerance', { tolerance: 0.01 }))
    ).toBe(true);
    expect(
      compareOutput(1.1, testCase(1, 'numberTolerance', { tolerance: 0.01 }))
    ).toBe(false);
    expect(
      compareOutput(
        '  HELLO \n world ',
        testCase('hello world', 'stringNormalized', {
          ignoreCase: true,
          normalizeWhitespace: true,
        })
      )
    ).toBe(true);
    expect(
      compareOutput(' HELLO ', testCase('hello', 'stringNormalized'))
    ).toBe(false);
  });
  it('rejects incomplete and unsupported challenges before execution', () => {
    expect(() => validateChallenge(initialContent)).toThrow(
      'Reference solution'
    );
    const complete = {
      ...initialContent,
      referenceSolution: { code: 'function solve(x) { return x; }' },
    };
    expect(() => validateChallenge(complete)).not.toThrow();
    expect(() => validateChallenge({ ...complete, hiddenTests: [] })).toThrow(
      'hidden'
    );
    expect(() =>
      validateChallenge({
        ...complete,
        sampleTests: [testCase({}, 'strictEqual')],
      })
    ).toThrow('deepEqual');
    expect(() =>
      validateChallenge({ ...complete, sampleTests: [testCase(1, 'custom')] })
    ).toThrow('unsupported');
  });
  it('hashes content consistently and ignores publication metadata', () => {
    const base = { ...initialContent, referenceSolution: { code: 'solve' } };
    expect(contentHash(base)).toBe(
      contentHash({ ...base, publishedAt: 'today' })
    );
    expect(contentHash(base)).not.toBe(
      contentHash({ ...base, promptMarkdown: 'Changed' })
    );
  });
});
