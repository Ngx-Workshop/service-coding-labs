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
  kind: ComparatorKind;

  @Prop()
  tolerance?: number;

  @Prop()
  normalizeWhitespace?: boolean;

  @Prop()
  ignoreCase?: boolean;

  @Prop()
  customComparatorId?: string;
}

const ComparatorSchema = SchemaFactory.createForClass(ComparatorMongo);

@Schema({ _id: false, versionKey: false })
export class LabTestCaseMongo {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['io', 'unit'] })
  kind: 'io' | 'unit';

  @Prop({ type: MongooseSchema.Types.Mixed })
  input?: unknown;

  @Prop({ type: MongooseSchema.Types.Mixed })
  expected?: unknown;

  @Prop({ type: ComparatorSchema })
  comparator?: ComparatorMongo;

  @Prop()
  testCode?: string;

  @Prop({ enum: ['jest', 'vitest'] })
  framework?: 'jest' | 'vitest';
}

const LabTestCaseSchema = SchemaFactory.createForClass(LabTestCaseMongo);

@Schema({ _id: false, versionKey: false })
export class LabRunnerConfigMongo implements LabRunnerConfig {
  @Prop({ required: true })
  timeoutMs: number;

  @Prop()
  memoryMb?: number;

  @Prop()
  entryFnName?: string;

  @Prop()
  nodeVersion?: string;
}

const LabRunnerConfigSchema = SchemaFactory.createForClass(LabRunnerConfigMongo);

@Schema({ _id: false, versionKey: false })
export class ReferenceSolutionMongo {
  @Prop({ required: true })
  code: string;

  @Prop()
  notesMarkdown?: string;
}

const ReferenceSolutionSchema =
  SchemaFactory.createForClass(ReferenceSolutionMongo);

export type HandsOnLabVersionDocument = HandsOnLabVersionMongo & Document;

@Schema({ collection: 'hands_on_lab_versions', versionKey: false })
export class HandsOnLabVersionMongo implements HandsOnLabVersion {
  _id: string;

  @Prop({ required: true })
  labId: string;

  @Prop({ required: true })
  versionNumber: number;

  @Prop({ required: true, default: true })
  isDraft: boolean;

  @Prop({ required: true, enum: LAB_LANGUAGES })
  language: LabLanguage;

  @Prop({ required: true })
  promptMarkdown: string;

  @Prop({ type: [String], default: [] })
  hints?: string[];

  @Prop({ required: true })
  starterCode: string;

  @Prop({ type: ReferenceSolutionSchema })
  referenceSolution?: ReferenceSolutionMongo;

  @Prop({ type: [LabTestCaseSchema], default: [] })
  sampleTests: LabTestCase[];

  @Prop({ type: [LabTestCaseSchema], default: [] })
  hiddenTests: LabTestCase[];

  @Prop({ required: true, type: LabRunnerConfigSchema })
  runner: LabRunnerConfig;

  @Prop()
  publishedAt?: string;

  @Prop()
  publishedBy?: string;

  @Prop({ required: true, default: () => new Date().toISOString() })
  createdAt: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  contentHash?: string;
}

export const HandsOnLabVersionSchema =
  SchemaFactory.createForClass(HandsOnLabVersionMongo);
HandsOnLabVersionSchema.index({ labId: 1, versionNumber: 1 });
HandsOnLabVersionSchema.index({ labId: 1, isDraft: 1 });
