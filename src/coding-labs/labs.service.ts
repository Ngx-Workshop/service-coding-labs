import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import {
  HandsOnLabDocument,
  HandsOnLabMongo,
} from './schemas/hands_on_labs.schema';

@Injectable()
export class LabsService {
  constructor(
    @InjectModel(HandsOnLabMongo.name)
    private readonly labModel: Model<HandsOnLabDocument>
  ) {}

  async create(createLabDto: CreateLabDto): Promise<HandsOnLabMongo> {
    if (createLabDto.status && createLabDto.status !== 'draft')
      throw new BadRequestException('New labs must start as drafts');
    const now = new Date().toISOString();
    try {
      const doc = new this.labModel({
        ...createLabDto,
        tags: createLabDto.tags ?? [],
        status: createLabDto.status ?? 'draft',
        createdAt: now,
        updatedAt: now,
        updatedBy: createLabDto.updatedBy ?? createLabDto.createdBy,
      });
      return await doc.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'A lab with this workshopId + slug already exists'
        );
      }
      throw error;
    }
  }

  async findAll(filters: {
    workshopId?: string;
    status?: string;
    tag?: string;
    q?: string;
    limit?: number;
    skip?: number;
  }): Promise<HandsOnLabMongo[]> {
    const query: FilterQuery<HandsOnLabDocument> = {};

    if (filters.workshopId) {
      query.workshopId = filters.workshopId;
    }
    if (filters.status) {
      if (!['draft', 'published', 'archived'].includes(filters.status)) {
        throw new BadRequestException(
          'status must be draft|published|archived'
        );
      }
      query.status = filters.status;
    }
    if (filters.tag) {
      query.tags = filters.tag;
    }
    if (filters.q) {
      const qRegex = new RegExp(
        filters.q.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&'),
        'i'
      );
      query.$or = [{ title: qRegex }, { summary: qRegex }, { slug: qRegex }];
    }

    if (
      filters.limit !== undefined &&
      (!Number.isInteger(filters.limit) ||
        filters.limit < 1 ||
        filters.limit > 100)
    )
      throw new BadRequestException(
        'limit must be an integer between 1 and 100'
      );
    if (
      filters.skip !== undefined &&
      (!Number.isInteger(filters.skip) || filters.skip < 0)
    )
      throw new BadRequestException('skip must be a nonnegative integer');
    return this.labModel
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(filters.limit ?? 50)
      .skip(filters.skip ?? 0)
      .exec();
  }

  async findOne(labId: string): Promise<HandsOnLabMongo> {
    const doc = await this.labModel.findById(labId).exec();
    if (!doc) {
      throw new NotFoundException(`Lab "${labId}" not found`);
    }
    return doc;
  }

  async update(
    labId: string,
    updateLabDto: UpdateLabDto
  ): Promise<HandsOnLabMongo> {
    const current = await this.findOne(labId);
    if (current.status === 'archived')
      throw new BadRequestException('Archived labs cannot be edited');
    try {
      const doc = await this.labModel
        .findByIdAndUpdate(
          labId,
          {
            ...updateLabDto,
            updatedAt: new Date().toISOString(),
          },
          { new: true, runValidators: true }
        )
        .exec();
      if (!doc) {
        throw new NotFoundException(`Lab "${labId}" not found`);
      }
      return doc;
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'A lab with this workshopId + slug already exists'
        );
      }
      throw error;
    }
  }

  async archive(labId: string, archivedBy?: string): Promise<HandsOnLabMongo> {
    const now = new Date().toISOString();
    const doc = await this.labModel
      .findOneAndUpdate(
        {
          _id: labId,
          $or: [
            { writeLockUntil: { $exists: false } },
            { writeLockUntil: { $lt: new Date() } },
          ],
        },
        {
          status: 'archived',
          archivedAt: now,
          archivedBy: archivedBy ?? 'system',
          updatedAt: now,
          updatedBy: archivedBy ?? 'system',
        },
        { new: true, runValidators: true }
      )
      .exec();
    if (!doc) {
      if (await this.labModel.exists({ _id: labId }))
        throw new ConflictException('Another operation is in progress');
      throw new NotFoundException(`Lab "${labId}" not found`);
    }
    return doc;
  }
}
