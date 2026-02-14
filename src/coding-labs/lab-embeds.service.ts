import { Injectable, NotFoundException } from '@nestjs/common';
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
    private readonly embedModel: Model<HandsOnLabEmbedDocument>
  ) {}

  async create(createEmbedDto: CreateEmbedDto): Promise<HandsOnLabEmbedMongo> {
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
    return this.embedModel.find(filters).sort({ createdAt: -1 }).exec();
  }

  async remove(embedId: string): Promise<void> {
    const deleted = await this.embedModel.findByIdAndDelete(embedId).exec();
    if (!deleted) {
      throw new NotFoundException(`Embed "${embedId}" not found`);
    }
  }
}
