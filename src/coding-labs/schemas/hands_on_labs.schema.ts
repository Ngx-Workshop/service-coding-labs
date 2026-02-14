import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { HandsOnLab, LabStatus } from '../../collection-interfaces';

const LAB_STATUSES: LabStatus[] = ['draft', 'published', 'archived'];
const LAB_DIFFICULTIES = ['intro', 'easy', 'medium', 'hard'] as const;

export type HandsOnLabDocument = HandsOnLabMongo & Document;

@Schema({ collection: 'hands_on_labs', versionKey: false })
export class HandsOnLabMongo implements HandsOnLab {
  _id: string;

  @Prop({ required: true })
  workshopId: string;

  @Prop()
  workshopDocumentGroupId?: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  summary?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ enum: LAB_DIFFICULTIES })
  difficulty?: 'intro' | 'easy' | 'medium' | 'hard';

  @Prop()
  estimatedMinutes?: number;

  @Prop({ required: true, enum: LAB_STATUSES, default: 'draft' })
  status: LabStatus;

  @Prop()
  currentDraftVersionId?: string;

  @Prop()
  latestPublishedVersionId?: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  createdAt: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  updatedAt: string;

  @Prop({ required: true })
  updatedBy: string;

  @Prop()
  archivedAt?: string;

  @Prop()
  archivedBy?: string;
}

export const HandsOnLabSchema = SchemaFactory.createForClass(HandsOnLabMongo);
HandsOnLabSchema.index({ workshopId: 1, slug: 1 }, { unique: true });
