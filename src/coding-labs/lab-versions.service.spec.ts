import { BadRequestException } from '@nestjs/common';
import { LabVersionsService } from './lab-versions.service';

describe('LabVersionsService', () => {
  let service: LabVersionsService;
  let labVersionModel: any;
  let labModel: any;

  beforeEach(() => {
    labVersionModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    labModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      exists: jest.fn(),
    };
    service = new LabVersionsService(labVersionModel, labModel);
  });

  it('rejects publish when sample tests are empty', async () => {
    labModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'lab-1' }),
    });
    labVersionModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: 'ver-1',
        labId: 'lab-1',
        isDraft: true,
        sampleTests: [],
        runner: { timeoutMs: 1000 },
      }),
    });

    await expect(
      service.publish('lab-1', 'ver-1', { publishedBy: 'user-1' })
    ).rejects.toThrow(BadRequestException);
  });

  it('publishes a valid draft and updates lab pointers', async () => {
    labModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'lab-1' }),
    });
    labVersionModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: 'ver-1',
        labId: 'lab-1',
        isDraft: true,
        sampleTests: [{ _id: 'test-1', name: 't', kind: 'io' }],
        runner: { timeoutMs: 1000 },
      }),
    });
    labVersionModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: 'ver-1',
        labId: 'lab-1',
        isDraft: false,
      }),
    });
    labModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'lab-1' }),
    });

    const result = await service.publish('lab-1', 'ver-1', {
      publishedBy: 'user-1',
    });

    expect(result.isDraft).toBe(false);
    expect(labVersionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'ver-1',
      expect.objectContaining({
        isDraft: false,
        publishedBy: 'user-1',
      }),
      { new: true }
    );
    expect(labModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'lab-1',
      expect.objectContaining({
        $set: expect.objectContaining({
          latestPublishedVersionId: 'ver-1',
          status: 'published',
          updatedBy: 'user-1',
        }),
        $unset: { currentDraftVersionId: '' },
      })
    );
  });
});
