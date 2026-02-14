import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { HandsOnLabEmbedRef } from '../../collection-interfaces';

export type HandsOnLabEmbedDocument = HandsOnLabEmbedMongo & Document;

@Schema({ collection: 'hands_on_lab_embeds', versionKey: false })
export class HandsOnLabEmbedMongo implements HandsOnLabEmbedRef {
  _id: string;

  @Prop({ required: true })
  labId: string;

  @Prop({ required: true, index: true })
  workshopId: string;

  @Prop({ required: true })
  workshopDocumentId: string;

  @Prop({ required: true })
  blockId: string;

  @Prop({ required: true, enum: ['handsOnLab'], default: 'handsOnLab' })
  blockType: 'handsOnLab';

  @Prop()
  pinnedVersionId?: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  createdAt: string;

  @Prop({ required: true })
  createdBy: string;
}

export const HandsOnLabEmbedSchema =
  SchemaFactory.createForClass(HandsOnLabEmbedMongo);
HandsOnLabEmbedSchema.index({ labId: 1 });
HandsOnLabEmbedSchema.index({ workshopDocumentId: 1 });
