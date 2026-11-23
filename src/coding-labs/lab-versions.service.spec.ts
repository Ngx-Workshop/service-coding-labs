import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { LabVersionsService } from './lab-versions.service';
import { initialContent } from './challenge-content';

describe('LabVersionsService publication boundary', () => {
  let service: LabVersionsService;
  let versions: { findOne: jest.Mock; findOneAndUpdate: jest.Mock };
  let labs: {
    findOneAndUpdate: jest.Mock;
    updateOne: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findById?: jest.Mock;
  };
  let runner: { verify: jest.Mock };
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  const lab = { _id: 'lab', status: 'draft', currentDraftVersionId: 'version' };
  const version = {
    ...initialContent,
    _id: 'version',
    labId: 'lab',
    isDraft: true,
    contentHash: 'old',
  };
  const query = (value: unknown) => ({
    exec: jest.fn().mockResolvedValue(value),
  });
  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    versions = {
      findOne: jest.fn(() => query(version)),
      findOneAndUpdate: jest.fn(() => query({ ...version, isDraft: false })),
    };
    labs = {
      findOneAndUpdate: jest.fn(() => query(lab)),
      updateOne: jest.fn(() => query({})),
      findByIdAndUpdate: jest.fn(() => query(lab)),
    };
    runner = {
      verify: jest
        .fn()
        .mockResolvedValue({ passed: true, contentHash: 'verified' }),
    };
    service = new LabVersionsService(
      versions as never,
      labs as never,
      runner as never
    );
  });
  afterEach(() => jest.restoreAllMocks());
  it('reruns the saved solution before publication and uses its hash', async () => {
    await service.publish('lab', 'version', {
      publishedBy: 'admin',
      expectedContentHash: 'old',
    });
    expect(runner.verify).toHaveBeenCalledWith(version);
    expect(versions.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'version', labId: 'lab', isDraft: true },
      {
        $set: expect.objectContaining({
          isDraft: false,
          contentHash: 'verified',
        }),
      },
      expect.anything()
    );
    expect(labs.updateOne).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'lab_published', outcome: 'success' })
    );
  });
  it('does not publish failing tests and releases the writer lock', async () => {
    runner.verify.mockResolvedValue({ passed: false, results: [] });
    await expect(
      service.publish('lab', 'version', {
        publishedBy: 'admin',
        expectedContentHash: 'old',
      })
    ).rejects.toThrow(BadRequestException);
    expect(versions.findOneAndUpdate).not.toHaveBeenCalled();
    expect(labs.updateOne).toHaveBeenCalled();
  });
  it('refuses publication when the saved snapshot changed', async () => {
    await expect(
      service.publish('lab', 'version', {
        publishedBy: 'admin',
        expectedContentHash: 'stale',
      })
    ).rejects.toThrow(ConflictException);
    expect(runner.verify).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'rejected', statusCode: 409 })
    );
  });
  it('repairs a failed publication pointer write on retry', async () => {
    versions.findOne.mockReturnValue(
      query({ ...version, isDraft: false, publishedAt: 'yesterday' })
    );
    const result = await service.publish('lab', 'version', {
      publishedBy: 'admin',
      expectedContentHash: 'old',
    });
    expect(result.isDraft).toBe(false);
    expect(versions.findOneAndUpdate).not.toHaveBeenCalled();
    expect(labs.findByIdAndUpdate).toHaveBeenCalledWith(
      'lab',
      expect.objectContaining({
        $set: expect.objectContaining({ latestPublishedVersionId: 'version' }),
      })
    );
  });
  it('propagates a pointer storage failure, releases the lock and repairs on retry', async () => {
    labs.findByIdAndUpdate.mockReturnValueOnce({
      exec: jest.fn().mockRejectedValue(new Error('storage unavailable')),
    });
    const publish = () =>
      service.publish('lab', 'version', {
        publishedBy: 'admin',
        expectedContentHash: 'old',
      });
    await expect(publish()).rejects.toThrow('storage unavailable');
    expect(labs.updateOne).toHaveBeenCalledTimes(1);
    versions.findOne.mockReturnValue(query({ ...version, isDraft: false }));
    await expect(publish()).resolves.toMatchObject({ isDraft: false });
    expect(labs.updateOne).toHaveBeenCalledTimes(2);
    expect(versions.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(runner.verify).toHaveBeenCalledTimes(2);
  });
  it('rejects published edits and stale draft writes', async () => {
    await expect(
      service.patchDraft('lab', 'version', {
        createdBy: 'admin',
        expectedContentHash: 'stale',
      })
    ).rejects.toThrow(ConflictException);
    versions.findOne.mockReturnValue(query({ ...version, isDraft: false }));
    await expect(
      service.patchDraft('lab', 'version', {
        createdBy: 'admin',
        expectedContentHash: 'old',
      })
    ).rejects.toThrow('immutable');
    expect(versions.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('rejects edits to a superseded draft', async () => {
    labs.findOneAndUpdate.mockReturnValue(
      query({ ...lab, currentDraftVersionId: 'new-version' })
    );
    await expect(
      service.publish('lab', 'version', {
        publishedBy: 'admin',
        expectedContentHash: 'old',
      })
    ).rejects.toThrow(ConflictException);
    expect(runner.verify).not.toHaveBeenCalled();
  });
  it('redacts solutions and hidden tests from public content', async () => {
    labs.findById = jest.fn(() =>
      query({
        ...lab,
        status: 'published',
        latestPublishedVersionId: 'version',
        title: 'Title',
      })
    );
    versions.findOne.mockReturnValue({
      lean: () =>
        query({
          ...version,
          isDraft: false,
          referenceSolution: { code: 'secret' },
        }),
    });
    const content = await service.learnerContent('lab');
    expect(content).not.toHaveProperty('hiddenTests');
    expect(content).not.toHaveProperty('referenceSolution');
    expect(content.sampleTests.length).toBe(1);
  });
});
