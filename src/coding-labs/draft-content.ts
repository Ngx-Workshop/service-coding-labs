import { Types } from 'mongoose';
import { initialContent } from './challenge-content';
import {
  CreateDraftVersionDto,
  LabTestCaseDto,
} from './dto/create-draft-version.dto';
import { HandsOnLabVersionMongo } from './schemas/hands_on_lab_versions.schema';
import { LabTestCase } from '../collection-interfaces';

function normalizeTests(tests: LabTestCaseDto[]): LabTestCase[] {
  return tests.map((test) => ({
    ...(JSON.parse(JSON.stringify(test)) as LabTestCase),
    _id: test._id ?? new Types.ObjectId().toString(),
  }));
}

export function draftContent(
  dto: Partial<CreateDraftVersionDto>,
  source: Partial<HandsOnLabVersionMongo>
): Partial<HandsOnLabVersionMongo> {
  return {
    language: dto.language ?? source.language ?? 'typescript',
    promptMarkdown: dto.promptMarkdown ?? source.promptMarkdown ?? '',
    starterCode: dto.starterCode ?? source.starterCode ?? '',
    hints: dto.hints ?? source.hints ?? [],
    referenceSolution: dto.referenceSolution ?? source.referenceSolution,
    sampleTests: normalizeTests(dto.sampleTests ?? source.sampleTests ?? []),
    hiddenTests: normalizeTests(dto.hiddenTests ?? source.hiddenTests ?? []),
    runner: dto.runner ?? source.runner ?? initialContent.runner,
  };
}
