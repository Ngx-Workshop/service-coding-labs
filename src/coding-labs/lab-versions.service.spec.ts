import { BadRequestException, ConflictException } from '@nestjs/common';
import { LabVersionsService } from './lab-versions.service';
import { initialContent } from './challenge-content';

describe('LabVersionsService publication boundary', () => {
  let service: LabVersionsService;
  let versions: any;
  let labs: any;
  let runner: any;
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
    service = new LabVersionsService(versions, labs, runner);
  });
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
