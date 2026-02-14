import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateDraftVersionDto,
  LabTestCaseDto,
  UpdateDraftVersionDto,
} from './dto/create-draft-version.dto';
import { PublishVersionDto } from './dto/publish-version.dto';
import {
  HandsOnLabDocument,
  HandsOnLabMongo,
} from './schemas/hands_on_labs.schema';
import {
  HandsOnLabVersionDocument,
  HandsOnLabVersionMongo,
} from './schemas/hands_on_lab_versions.schema';

@Injectable()
export class LabVersionsService {
  constructor(
    @InjectModel(HandsOnLabVersionMongo.name)
    private readonly labVersionModel: Model<HandsOnLabVersionDocument>,
    @InjectModel(HandsOnLabMongo.name)
    private readonly labModel: Model<HandsOnLabDocument>
  ) {}

  async createDraft(
    labId: string,
    createDraftVersionDto: CreateDraftVersionDto
  ): Promise<HandsOnLabVersionMongo> {
    const lab = await this.labModel.findById(labId).exec();
    if (!lab) {
      throw new NotFoundException(`Lab "${labId}" not found`);
    }

    const latestVersion = await this.labVersionModel
      .findOne({ labId })
      .sort({ versionNumber: -1 })
      .exec();
    const latestPublished = await this.labVersionModel
      .findOne({ labId, isDraft: false })
      .sort({ versionNumber: -1 })
      .exec();

    const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;
    const now = new Date().toISOString();
    const source = latestPublished;

    const draftPayload = {
      labId,
      versionNumber,
      isDraft: true,
      language: createDraftVersionDto.language ?? source?.language,
      promptMarkdown:
        createDraftVersionDto.promptMarkdown ?? source?.promptMarkdown,
      hints: createDraftVersionDto.hints ?? source?.hints ?? [],
      starterCode: createDraftVersionDto.starterCode ?? source?.starterCode,
      referenceSolution:
        createDraftVersionDto.referenceSolution ?? source?.referenceSolution,
      sampleTests: this.normalizeTests(
        createDraftVersionDto.sampleTests ?? source?.sampleTests ?? []
      ),
      hiddenTests: this.normalizeTests(
        createDraftVersionDto.hiddenTests ?? source?.hiddenTests ?? []
      ),
      runner: createDraftVersionDto.runner ?? source?.runner,
      contentHash: createDraftVersionDto.contentHash ?? source?.contentHash,
      createdAt: now,
      createdBy: createDraftVersionDto.createdBy,
    };

    if (
      !draftPayload.language ||
      !draftPayload.promptMarkdown ||
      !draftPayload.starterCode ||
      !draftPayload.runner
    ) {
      throw new BadRequestException(
        'Draft content is incomplete. Provide content fields or publish at least one version first.'
      );
    }

    const draft = new this.labVersionModel(draftPayload);
    const savedDraft = await draft.save();

    await this.labModel
      .findByIdAndUpdate(labId, {
        currentDraftVersionId: savedDraft._id,
        updatedAt: now,
        updatedBy: createDraftVersionDto.createdBy,
      })
      .exec();

    return savedDraft;
  }

  async findAll(labId: string): Promise<HandsOnLabVersionMongo[]> {
    await this.ensureLabExists(labId);
    return this.labVersionModel
      .find({ labId })
      .sort({ versionNumber: -1 })
      .exec();
  }

  async findOne(labId: string, versionId: string): Promise<HandsOnLabVersionMongo> {
    const doc = await this.labVersionModel
      .findOne({ _id: versionId, labId })
      .exec();
    if (!doc) {
      throw new NotFoundException(
        `Version "${versionId}" not found for lab "${labId}"`
      );
    }
    return doc;
  }

  async patchDraft(
    labId: string,
    versionId: string,
    updateDraftVersionDto: UpdateDraftVersionDto
  ): Promise<HandsOnLabVersionMongo> {
    await this.ensureLabExists(labId);
    const current = await this.findOne(labId, versionId);
    if (!current.isDraft) {
      throw new BadRequestException('Published versions are immutable');
    }

    const latestVersion = await this.labVersionModel
      .findOne({ labId })
      .sort({ versionNumber: -1 })
      .exec();
    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
    const now = new Date().toISOString();

    const newDraft = new this.labVersionModel({
      labId,
      versionNumber: nextVersionNumber,
      isDraft: true,
      language: updateDraftVersionDto.language ?? current.language,
      promptMarkdown:
        updateDraftVersionDto.promptMarkdown ?? current.promptMarkdown,
      hints: updateDraftVersionDto.hints ?? current.hints ?? [],
      starterCode: updateDraftVersionDto.starterCode ?? current.starterCode,
      referenceSolution:
        updateDraftVersionDto.referenceSolution ?? current.referenceSolution,
      sampleTests: this.normalizeTests(
        updateDraftVersionDto.sampleTests ?? current.sampleTests ?? []
      ),
      hiddenTests: this.normalizeTests(
        updateDraftVersionDto.hiddenTests ?? current.hiddenTests ?? []
      ),
      runner: updateDraftVersionDto.runner ?? current.runner,
      contentHash: updateDraftVersionDto.contentHash ?? current.contentHash,
      createdAt: now,
      createdBy: updateDraftVersionDto.createdBy,
    });

    const savedDraft = await newDraft.save();
    await this.labModel
      .findByIdAndUpdate(labId, {
        currentDraftVersionId: savedDraft._id,
        updatedAt: now,
        updatedBy: updateDraftVersionDto.createdBy,
      })
      .exec();

    return savedDraft;
  }

  async publish(
    labId: string,
    versionId: string,
    publishVersionDto: PublishVersionDto
  ): Promise<HandsOnLabVersionMongo> {
    const lab = await this.labModel.findById(labId).exec();
    if (!lab) {
      throw new NotFoundException(`Lab "${labId}" not found`);
    }

    const version = await this.findOne(labId, versionId);
    if (!version.isDraft) {
      throw new BadRequestException('Version is already published');
    }
    if (!version.sampleTests || version.sampleTests.length === 0) {
      throw new BadRequestException(
        'At least one sample test is required before publishing'
      );
    }
    if (
      !version.runner?.timeoutMs ||
      version.runner.timeoutMs < 100 ||
      version.runner.timeoutMs > 300000
    ) {
      throw new BadRequestException(
        'runner.timeoutMs must be between 100 and 300000'
      );
    }

    const now = new Date().toISOString();
    const published = await this.labVersionModel
      .findByIdAndUpdate(
        versionId,
        {
          isDraft: false,
          publishedAt: now,
          publishedBy: publishVersionDto.publishedBy,
        },
        { new: true }
      )
      .exec();

    if (!published) {
      throw new NotFoundException(
        `Version "${versionId}" not found for lab "${labId}"`
      );
    }

    await this.labModel
      .findByIdAndUpdate(labId, {
        $set: {
          latestPublishedVersionId: published._id,
          status: 'published',
          updatedAt: now,
          updatedBy: publishVersionDto.publishedBy,
        },
        $unset: { currentDraftVersionId: '' },
      })
      .exec();

    return published;
  }

  private normalizeTests(testCases: LabTestCaseDto[]): LabTestCaseDto[] {
    return testCases.map((testCase) => ({
      ...testCase,
      _id: testCase._id ?? new Types.ObjectId().toString(),
    }));
  }

  private async ensureLabExists(labId: string): Promise<void> {
    const exists = await this.labModel.exists({ _id: labId });
    if (!exists) {
      throw new NotFoundException(`Lab "${labId}" not found`);
    }
  }
}
