import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
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
import { ChallengeRunnerService } from './challenge-runner.service';
import { contentHash, initialContent } from './challenge-content';

@Injectable()
export class LabVersionsService {
  constructor(
    @InjectModel(HandsOnLabVersionMongo.name)
    private readonly versions: Model<HandsOnLabVersionDocument>,
    @InjectModel(HandsOnLabMongo.name)
    private readonly labs: Model<HandsOnLabDocument>,
    private readonly runner: ChallengeRunnerService
  ) {}

  async createDraft(
    labId: string,
    dto: CreateDraftVersionDto
  ): Promise<HandsOnLabVersionMongo> {
    return this.withLock(labId, async (lab) => {
      if (lab.currentDraftVersionId) {
        const existing = await this.versions
          .findOne({ _id: lab.currentDraftVersionId, labId, isDraft: true })
          .exec();
        if (existing) {
          if (!existing.contentHash)
            existing.contentHash = contentHash(existing);
          return existing;
        }
      }
      const latest = await this.versions
        .findOne({ labId })
        .sort({ versionNumber: -1 })
        .exec();
      const source = await this.versions
        .findOne({ labId, isDraft: false })
        .sort({ versionNumber: -1 })
        .lean()
        .exec();
      const versionNumber =
        Math.max(lab.nextVersionNumber ?? 0, latest?.versionNumber ?? 0) + 1;
      const content = this.content(dto, source ?? initialContent);
      const draft = await new this.versions({
        ...content,
        labId,
        versionNumber,
        isDraft: true,
        contentHash: contentHash(content),
        createdAt: new Date().toISOString(),
        createdBy: dto.createdBy,
      }).save();
      await this.labs
        .findByIdAndUpdate(labId, {
          currentDraftVersionId: draft._id,
          nextVersionNumber: versionNumber,
          updatedAt: new Date().toISOString(),
          updatedBy: dto.createdBy,
        })
        .exec();
      return draft;
    });
  }

  async findAll(labId: string): Promise<HandsOnLabVersionMongo[]> {
    await this.ensureLab(labId);
    return this.versions.find({ labId }).sort({ versionNumber: -1 }).exec();
  }

  async findOne(
    labId: string,
    versionId: string
  ): Promise<HandsOnLabVersionMongo> {
    const version = await this.versions
      .findOne({ _id: versionId, labId })
      .exec();
    if (!version) throw new NotFoundException('Version not found for this lab');
    if (!version.contentHash) version.contentHash = contentHash(version);
    return version;
  }

  async patchDraft(
    labId: string,
    versionId: string,
    dto: UpdateDraftVersionDto
  ): Promise<HandsOnLabVersionMongo> {
    return this.withLock(labId, async (lab) => {
      const current = await this.requireCurrentDraft(lab, versionId);
      if (
        dto.expectedContentHash !==
        (current.contentHash ?? contentHash(current))
      ) {
        throw new ConflictException(
          'This draft changed. Reload before saving to avoid overwriting another author.'
        );
      }
      const content = this.content(dto, current);
      const updated = await this.versions
        .findOneAndUpdate(
          { _id: versionId, labId, isDraft: true },
          { $set: { ...content, contentHash: contentHash(content) } },
          { new: true, runValidators: true }
        )
        .exec();
      if (!updated)
        throw new ConflictException('Draft changed; reload and retry');
      await this.labs
        .findByIdAndUpdate(labId, {
          updatedAt: new Date().toISOString(),
          updatedBy: dto.createdBy,
        })
        .exec();
      return updated;
    });
  }

  async verify(labId: string, versionId: string) {
    return this.withLock(labId, async (lab) =>
      this.runner.verify(await this.requireCurrentDraft(lab, versionId))
    );
  }

  async publish(
    labId: string,
    versionId: string,
    dto: PublishVersionDto
  ): Promise<HandsOnLabVersionMongo> {
    return this.withLock(labId, async (lab) => {
      const version = await this.findOne(labId, versionId);
      if (
        dto.expectedContentHash !==
        (version.contentHash ?? contentHash(version))
      ) {
        throw new ConflictException(
          'This draft changed. Reload and verify the latest content before publishing.'
        );
      }
      if (
        !version.isDraft &&
        String(lab.latestPublishedVersionId) === versionId
      )
        return version;
      if (String(lab.currentDraftVersionId) !== versionId)
        throw new ConflictException('Only the current draft can be published');
      // A retry repairs a failed lab-pointer write after a successful version write.
      const verification = await this.runner.verify(version);
      if (!verification.passed)
        throw new BadRequestException({
          message:
            'Reference solution must pass every sample and hidden test before publishing',
          verification,
        });
      const now = new Date().toISOString();
      const published = !version.isDraft
        ? version
        : await this.versions
            .findOneAndUpdate(
              { _id: versionId, labId, isDraft: true },
              {
                $set: {
                  isDraft: false,
                  publishedAt: now,
                  publishedBy: dto.publishedBy,
                  contentHash: verification.contentHash,
                },
              },
              { new: true, runValidators: true }
            )
            .exec();
      if (!published)
        throw new ConflictException('Draft changed; reload and retry');
      await this.labs
        .findByIdAndUpdate(labId, {
          $set: {
            latestPublishedVersionId: published._id,
            status: 'published',
            updatedAt: now,
            updatedBy: dto.publishedBy,
          },
          $unset: { currentDraftVersionId: '' },
        })
        .exec();
      return published;
    });
  }

  async learnerContent(labId: string, versionId?: string) {
    const lab = await this.ensureLab(labId);
    if (lab.status !== 'published')
      throw new NotFoundException('Published lab not found');
    const version = await this.versions
      .findOne({
        _id: versionId ?? lab.latestPublishedVersionId,
        labId,
        isDraft: false,
      })
      .lean()
      .exec();
    if (!version) throw new NotFoundException('Published version not found');
    // Explicit allowlist: do not serialize the stored authoring object.
    return {
      labId,
      versionId: String(version._id),
      versionNumber: version.versionNumber,
      title: lab.title,
      difficulty: lab.difficulty,
      language: version.language,
      promptMarkdown: version.promptMarkdown,
      hints: version.hints ?? [],
      starterCode: version.starterCode,
      sampleTests: version.sampleTests,
      entryFnName: version.runner.entryFnName,
    };
  }

  private content(
    dto: CreateDraftVersionDto | UpdateDraftVersionDto,
    source: Partial<HandsOnLabVersionMongo>
  ): Partial<HandsOnLabVersionMongo> {
    return {
      language: dto.language ?? source.language ?? 'typescript',
      promptMarkdown: dto.promptMarkdown ?? source.promptMarkdown ?? '',
      starterCode: dto.starterCode ?? source.starterCode ?? '',
      hints: dto.hints ?? source.hints ?? [],
      referenceSolution: dto.referenceSolution ?? source.referenceSolution,
      sampleTests: this.normalize(dto.sampleTests ?? source.sampleTests ?? []),
      hiddenTests: this.normalize(dto.hiddenTests ?? source.hiddenTests ?? []),
      runner: dto.runner ?? source.runner ?? initialContent.runner,
    };
  }

  private normalize(tests: LabTestCaseDto[]) {
    return tests.map((test) => ({
      ...JSON.parse(JSON.stringify(test)),
      _id: test._id ?? new Types.ObjectId().toString(),
    }));
  }

  private async requireCurrentDraft(lab: HandsOnLabMongo, versionId: string) {
    const version = await this.findOne(String(lab._id), versionId);
    if (!version.isDraft)
      throw new BadRequestException('Published versions are immutable');
    if (String(lab.currentDraftVersionId) !== versionId)
      throw new ConflictException(
        'Only the current draft can be edited or published'
      );
    return version;
  }

  private async ensureLab(labId: string) {
    const lab = await this.labs.findById(labId).exec();
    if (!lab) throw new NotFoundException('Lab not found');
    return lab;
  }

  // Serialize mutations across API instances without requiring Mongo replica-set
  // transactions. Expiry recovers a crashed writer; suite execution is <=60s.
  private async withLock<T>(
    labId: string,
    work: (lab: HandsOnLabMongo) => Promise<T>
  ): Promise<T> {
    const token = randomUUID();
    const lab = await this.labs
      .findOneAndUpdate(
        {
          _id: labId,
          $or: [
            { writeLockUntil: { $exists: false } },
            { writeLockUntil: { $lt: new Date() } },
          ],
        },
        {
          $set: {
            writeLockToken: token,
            writeLockUntil: new Date(Date.now() + 120000),
          },
        },
        { new: true }
      )
      .exec();
    if (!lab) {
      await this.ensureLab(labId);
      throw new ConflictException(
        'Another operation is in progress. Retry shortly.'
      );
    }
    try {
      if (lab.status === 'archived')
        throw new BadRequestException('Archived labs cannot be changed');
      return await work(lab);
    } finally {
      await this.labs
        .updateOne(
          { _id: labId, writeLockToken: token },
          { $unset: { writeLockToken: '', writeLockUntil: '' } }
        )
        .exec();
    }
  }
}
