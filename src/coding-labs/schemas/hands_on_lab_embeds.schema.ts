import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { HandsOnLabEmbedRef } from '../../collection-interfaces';

export type HandsOnLabEmbedDocument = HandsOnLabEmbedMongo & Document;

@Schema({ collection: 'hands_on_lab_embeds', versionKey: false })
export class HandsOnLabEmbedMongo implements HandsOnLabEmbedRef {
  @ApiProperty()
  _id: string;

  @Prop({ required: true })
  @ApiProperty()
  labId: string;

  @Prop({ required: true, index: true })
  @ApiProperty()
  workshopId: string;

  @Prop({ required: true })
  @ApiProperty()
  workshopDocumentId: string;

  @Prop({ required: true })
  @ApiProperty()
  blockId: string;

  @Prop({ required: true, enum: ['handsOnLab'], default: 'handsOnLab' })
  @ApiProperty({ type: String })
  blockType: 'handsOnLab';

  @Prop()
  @ApiPropertyOptional()
  pinnedVersionId?: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  @ApiProperty()
  createdAt: string;

  @Prop({ required: true })
  @ApiProperty()
  createdBy: string;
}

export const HandsOnLabEmbedSchema =
  SchemaFactory.createForClass(HandsOnLabEmbedMongo);
HandsOnLabEmbedSchema.index({ labId: 1 });
HandsOnLabEmbedSchema.index({ workshopDocumentId: 1 });
