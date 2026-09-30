import {
  HandsOnLabDocument,
  HandsOnLabMongo,
} from './schemas/hands_on_labs.schema';
import {
  HandsOnLabVersionDocument,
  HandsOnLabVersionMongo,
} from './schemas/hands_on_lab_versions.schema';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEmbedDto } from './dto/create-embed.dto';
import {
  HandsOnLabEmbedDocument,
  HandsOnLabEmbedMongo,
} from './schemas/hands_on_lab_embeds.schema';

@Injectable()
export class LabEmbedsService {
  constructor(
    @InjectModel(HandsOnLabEmbedMongo.name)
    private readonly embedModel: Model<HandsOnLabEmbedDocument>,
    @InjectModel(HandsOnLabMongo.name)
    private readonly labs: Model<HandsOnLabDocument>,
    @InjectModel(HandsOnLabVersionMongo.name)
    private readonly versions: Model<HandsOnLabVersionDocument>
  ) {}

  async create(createEmbedDto: CreateEmbedDto): Promise<HandsOnLabEmbedMongo> {
    const lab = await this.labs.findById(createEmbedDto.labId).exec();
    if (!lab || lab.status !== 'published')
      throw new BadRequestException('Embed a published lab');
    if (lab.workshopId !== createEmbedDto.workshopId)
      throw new BadRequestException('Embed workshop must match the lab');
    if (
      createEmbedDto.pinnedVersionId &&
      !(await this.versions.exists({
        _id: createEmbedDto.pinnedVersionId,
        labId: createEmbedDto.labId,
        isDraft: false,
      }))
    )
      throw new BadRequestException('Pin a published version of this lab');
    const doc = new this.embedModel({
      ...createEmbedDto,
      blockType: createEmbedDto.blockType ?? 'handsOnLab',
      createdAt: new Date().toISOString(),
    });
    return doc.save();
  }

  async findAll(filters: {
    labId?: string;
    workshopId?: string;
    workshopDocumentId?: string;
  }): Promise<HandsOnLabEmbedMongo[]> {
    return this.embedModel
      .find(
        Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== undefined)
        )
      )
      .sort({ createdAt: -1 })
      .exec();
  }

  async remove(embedId: string): Promise<void> {
    const deleted = await this.embedModel.findByIdAndDelete(embedId).exec();
    if (!deleted) {
      throw new NotFoundException(`Embed "${embedId}" not found`);
    }
  }
}
