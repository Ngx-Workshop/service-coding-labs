import {
  LabTestCaseDto,
  LabRunnerConfigDto,
  ReferenceSolutionDto,
} from '../dto/create-draft-version.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {
  ComparatorKind,
  HandsOnLabVersion,
  LabLanguage,
  LabRunnerConfig,
  LabTestCase,
} from '../../collection-interfaces';

const LAB_LANGUAGES: LabLanguage[] = ['typescript', 'javascript'];
const COMPARATOR_KINDS: ComparatorKind[] = [
  'deepEqual',
  'strictEqual',
  'numberTolerance',
  'stringNormalized',
  'custom',
];

@Schema({ _id: false, versionKey: false })
export class ComparatorMongo {
  @Prop({ required: true, enum: COMPARATOR_KINDS })
  @ApiProperty({ type: String })
  kind: ComparatorKind;

  @Prop()
  @ApiPropertyOptional()
  tolerance?: number;

  @Prop()
  @ApiPropertyOptional()
  normalizeWhitespace?: boolean;

  @Prop()
  @ApiPropertyOptional()
  ignoreCase?: boolean;

  @Prop()
  @ApiPropertyOptional()
  customComparatorId?: string;
}

const ComparatorSchema = SchemaFactory.createForClass(ComparatorMongo);

@Schema({ _id: false, versionKey: false })
export class LabTestCaseMongo {
  @Prop({ required: true })
  @ApiProperty()
  _id: string;

  @Prop({ required: true })
  @ApiProperty()
  name: string;

  @Prop({ required: true, enum: ['io', 'unit'] })
  @ApiProperty({ type: String })
  kind: 'io' | 'unit';

  @Prop({ type: MongooseSchema.Types.Mixed })
  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  input?: unknown;

  @Prop({ type: MongooseSchema.Types.Mixed })
  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  expected?: unknown;

  @Prop({ type: ComparatorSchema })
  @ApiPropertyOptional({ type: String })
  comparator?: ComparatorMongo;

  @Prop()
  @ApiPropertyOptional()
  testCode?: string;

  @Prop({ enum: ['jest', 'vitest'] })
  @ApiPropertyOptional({ type: String })
  framework?: 'jest' | 'vitest';
}

const LabTestCaseSchema = SchemaFactory.createForClass(LabTestCaseMongo);

@Schema({ _id: false, versionKey: false })
export class LabRunnerConfigMongo implements LabRunnerConfig {
  @Prop({ required: true })
  @ApiProperty()
  timeoutMs: number;

  @Prop()
  @ApiPropertyOptional()
  memoryMb?: number;

  @Prop()
  @ApiPropertyOptional()
  entryFnName?: string;

  @Prop()
  @ApiPropertyOptional()
  nodeVersion?: string;
}

const LabRunnerConfigSchema =
  SchemaFactory.createForClass(LabRunnerConfigMongo);

@Schema({ _id: false, versionKey: false })
export class ReferenceSolutionMongo {
  @Prop({ default: '' })
  @ApiProperty()
  code: string;

  @Prop()
  @ApiPropertyOptional()
  notesMarkdown?: string;
}

const ReferenceSolutionSchema = SchemaFactory.createForClass(
  ReferenceSolutionMongo
);

export type HandsOnLabVersionDocument = HandsOnLabVersionMongo & Document;

@Schema({ collection: 'hands_on_lab_versions', versionKey: false })
export class HandsOnLabVersionMongo implements HandsOnLabVersion {
  @ApiProperty()
  _id: string;

  @Prop({ required: true })
  @ApiProperty()
  labId: string;

  @Prop({ required: true })
  @ApiProperty()
  versionNumber: number;

  @Prop({ required: true, default: true })
  @ApiProperty()
  isDraft: boolean;

  @Prop({ required: true, enum: LAB_LANGUAGES })
  @ApiProperty({ enum: ['typescript', 'javascript'] })
  language: LabLanguage;

  @Prop({ default: '' })
  @ApiProperty()
  promptMarkdown: string;

  @Prop({ type: [String], default: [] })
  @ApiPropertyOptional({ type: [String] })
  hints?: string[];

  @Prop({ default: '' })
  @ApiProperty()
  starterCode: string;

  @Prop({ type: ReferenceSolutionSchema })
  @ApiPropertyOptional({ type: () => ReferenceSolutionDto })
  referenceSolution?: ReferenceSolutionMongo;

  @Prop({ type: [LabTestCaseSchema], default: [] })
  @ApiProperty({ type: () => [LabTestCaseDto] })
  sampleTests: LabTestCase[];

  @Prop({ type: [LabTestCaseSchema], default: [] })
  @ApiProperty({ type: () => [LabTestCaseDto] })
  hiddenTests: LabTestCase[];

  @Prop({ required: true, type: LabRunnerConfigSchema })
  @ApiProperty({ type: () => LabRunnerConfigDto })
  runner: LabRunnerConfig;

  @Prop()
  @ApiPropertyOptional()
  publishedAt?: string;

  @Prop()
  @ApiPropertyOptional()
  publishedBy?: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  @ApiProperty()
  createdAt: string;

  @Prop({ required: true })
  @ApiProperty()
  createdBy: string;

  @Prop()
  @ApiPropertyOptional()
  contentHash?: string;
}

export const HandsOnLabVersionSchema = SchemaFactory.createForClass(
  HandsOnLabVersionMongo
);
HandsOnLabVersionSchema.index({ labId: 1, versionNumber: 1 });
HandsOnLabVersionSchema.index({ labId: 1, isDraft: 1 });
