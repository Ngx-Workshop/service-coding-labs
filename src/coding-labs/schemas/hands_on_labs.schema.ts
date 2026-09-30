import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { HandsOnLab, LabStatus } from '../../collection-interfaces';

const LAB_STATUSES: LabStatus[] = ['draft', 'published', 'archived'];
const LAB_DIFFICULTIES = ['intro', 'easy', 'medium', 'hard'] as const;

export type HandsOnLabDocument = HandsOnLabMongo & Document;

@Schema({ collection: 'hands_on_labs', versionKey: false })
export class HandsOnLabMongo implements HandsOnLab {
  @ApiProperty()
  _id: string;

  @Prop() nextVersionNumber?: number;
  @Prop({ select: false }) writeLockToken?: string;
  @Prop({ select: false }) writeLockUntil?: Date;

  @Prop({ required: true })
  @ApiProperty()
  workshopId: string;

  @Prop()
  @ApiPropertyOptional()
  workshopDocumentGroupId?: string;

  @Prop({ required: true })
  @ApiProperty()
  slug: string;

  @Prop({ required: true })
  @ApiProperty()
  title: string;

  @Prop()
  @ApiPropertyOptional()
  summary?: string;

  @Prop({ type: [String], default: [] })
  @ApiProperty({ type: [String] })
  tags: string[];

  @Prop({ enum: LAB_DIFFICULTIES })
  @ApiPropertyOptional({ enum: ['intro', 'easy', 'medium', 'hard'] })
  difficulty?: 'intro' | 'easy' | 'medium' | 'hard';

  @Prop()
  @ApiPropertyOptional()
  estimatedMinutes?: number;

  @Prop({ required: true, enum: LAB_STATUSES, default: 'draft' })
  @ApiProperty({ enum: ['draft', 'published', 'archived'] })
  status: LabStatus;

  @Prop()
  @ApiPropertyOptional()
  currentDraftVersionId?: string;

  @Prop()
  @ApiPropertyOptional()
  latestPublishedVersionId?: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  @ApiProperty()
  createdAt: string;

  @Prop({ required: true })
  @ApiProperty()
  createdBy: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  @ApiProperty()
  updatedAt: string;

  @Prop({ required: true })
  @ApiProperty()
  updatedBy: string;

  @Prop()
  @ApiPropertyOptional()
  archivedAt?: string;

  @Prop()
  @ApiPropertyOptional()
  archivedBy?: string;
}

export const HandsOnLabSchema = SchemaFactory.createForClass(HandsOnLabMongo);
HandsOnLabSchema.index({ workshopId: 1, slug: 1 }, { unique: true });
