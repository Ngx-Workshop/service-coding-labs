import { LabVersionsService } from './lab-versions.service';
import { CodingLabsLearnerGuard } from './learner-labs.controller';
import { ExecutionContext } from '@nestjs/common';
import { initialContent } from './challenge-content';

describe('Learner lab boundary', () => {
  it('grades submitted code with saved tests, returning no hidden details or content hash', async () => {
    const version = { ...initialContent, isDraft: false };
    const runner = {
      verify: jest.fn().mockResolvedValue({
        passed: false,
        totalTests: 2,
        passedTests: 1,
        durationMs: 10,
        contentHash: 'private',
        results: [
          { name: 'sample', suite: 'sample', status: 'passed' },
          { name: 'secret', suite: 'hidden', expected: 'secret' },
        ],
      }),
    };
    const service = new LabVersionsService(
      {} as never,
      {} as never,
      runner as never
    );
    jest.spyOn(service, 'learnerContent').mockResolvedValue({} as never);
    jest.spyOn(service, 'findOne').mockResolvedValue(version as never);
    const result = await service.gradeLearner(
      'lab',
      'version',
      'function solve() { return 3; }'
    );
    expect(runner.verify).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceSolution: { code: 'function solve() { return 3; }' },
        hiddenTests: initialContent.hiddenTests,
      })
    );
    expect(result).toEqual({
      passed: false,
      totalTests: 2,
      passedTests: 1,
      durationMs: 10,
      results: [{ name: 'sample', suite: 'sample', status: 'passed' }],
    });
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it('refuses execution when the lab is unavailable', async () => {
    const runner = { verify: jest.fn() };
    const service = new LabVersionsService(
      {} as never,
      {} as never,
      runner as never
    );
    jest
      .spyOn(service, 'learnerContent')
      .mockRejectedValue(new Error('Archived'));
    await expect(
      service.gradeLearner('lab', 'version', 'code')
    ).rejects.toThrow('Archived');
    expect(runner.verify).not.toHaveBeenCalled();
  });
  it('requires platform authentication for grading and propagates rejection', async () => {
    const auth = {
      validateAccessToken: jest
        .fn()
        .mockRejectedValue(new Error('Unauthorized')),
    };
    const guard = new CodingLabsLearnerGuard(auth as never);
    const request = { body: { code: 'code' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toThrow('Unauthorized');
    expect(auth.validateAccessToken).toHaveBeenCalledWith(request);
    auth.validateAccessToken.mockResolvedValue(undefined);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
  it('catalog excludes drafts, archived records and authoring fields', async () => {
    const exec = jest
      .fn()
      .mockResolvedValue([
        {
          _id: 'lab',
          title: 'Sum',
          summary: 'Add numbers',
          slug: 'sum',
          workshopId: 'workshop',
          tags: [],
          createdBy: 'private',
          currentDraftVersionId: 'private',
        },
      ]);
    const labs = {
      find: jest.fn(() => ({ sort: () => ({ lean: () => ({ exec }) }) })),
    };
    const service = new LabVersionsService(
      {} as never,
      labs as never,
      {} as never
    );
    const catalog = await service.learnerCatalog();
    expect(labs.find).toHaveBeenCalledWith({
      status: 'published',
      latestPublishedVersionId: { $exists: true },
    });
    expect(catalog[0].labId).toBe('lab');
    expect(JSON.stringify(catalog)).not.toContain('private');
  });
});
