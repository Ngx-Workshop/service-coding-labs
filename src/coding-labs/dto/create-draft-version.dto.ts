import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { LabLanguage } from '../../collection-interfaces';

const LAB_LANGUAGES: LabLanguage[] = ['typescript', 'javascript'];

export class ComparatorDto {
  @ApiProperty({ enum: ['deepEqual', 'strictEqual', 'numberTolerance', 'stringNormalized', 'custom'] })
  @IsIn([
    'deepEqual',
    'strictEqual',
    'numberTolerance',
    'stringNormalized',
    'custom',
  ])
  kind: 'deepEqual' | 'strictEqual' | 'numberTolerance' | 'stringNormalized' | 'custom';

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  tolerance?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  normalizeWhitespace?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  ignoreCase?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customComparatorId?: string;
}

export class LabTestCaseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['io', 'unit'] })
  @IsIn(['io', 'unit'])
  kind: 'io' | 'unit';

  @ApiPropertyOptional()
  @ValidateIf((o: LabTestCaseDto) => o.kind === 'io')
  @IsDefined()
  input?: unknown;

  @ApiPropertyOptional()
  @ValidateIf((o: LabTestCaseDto) => o.kind === 'io')
  @IsDefined()
  expected?: unknown;

  @ApiPropertyOptional({ type: () => ComparatorDto })
  @ValidateIf((o: LabTestCaseDto) => o.kind === 'io')
  @ValidateNested()
  @Type(() => ComparatorDto)
  @IsDefined()
  comparator?: ComparatorDto;

  @ApiPropertyOptional()
  @ValidateIf((o: LabTestCaseDto) => o.kind === 'unit')
  @IsString()
  @IsNotEmpty()
  testCode?: string;

  @ApiPropertyOptional({ enum: ['jest', 'vitest'] })
  @ValidateIf((o: LabTestCaseDto) => o.kind === 'unit')
  @IsIn(['jest', 'vitest'])
  @IsOptional()
  framework?: 'jest' | 'vitest';
}

export class LabRunnerConfigDto {
  @ApiProperty()
  @IsInt()
  @Min(100)
  @Max(300000)
  timeoutMs: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(16)
  @Max(4096)
  @IsOptional()
  memoryMb?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entryFnName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nodeVersion?: string;
}

export class ReferenceSolutionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notesMarkdown?: string;
}

export class CreateDraftVersionDto {
  @ApiPropertyOptional({ enum: LAB_LANGUAGES })
  @IsIn(LAB_LANGUAGES)
  @IsOptional()
  language?: LabLanguage;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  promptMarkdown?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hints?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  starterCode?: string;

  @ApiPropertyOptional({ type: () => ReferenceSolutionDto })
  @ValidateNested()
  @Type(() => ReferenceSolutionDto)
  @IsOptional()
  referenceSolution?: ReferenceSolutionDto;

  @ApiPropertyOptional({ type: () => [LabTestCaseDto] })
  @ValidateNested({ each: true })
  @Type(() => LabTestCaseDto)
  @IsArray()
  @IsOptional()
  sampleTests?: LabTestCaseDto[];

  @ApiPropertyOptional({ type: () => [LabTestCaseDto] })
  @ValidateNested({ each: true })
  @Type(() => LabTestCaseDto)
  @IsArray()
  @IsOptional()
  hiddenTests?: LabTestCaseDto[];

  @ApiPropertyOptional({ type: () => LabRunnerConfigDto })
  @ValidateNested()
  @Type(() => LabRunnerConfigDto)
  @IsOptional()
  runner?: LabRunnerConfigDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contentHash?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

export class UpdateDraftVersionDto extends PartialType(CreateDraftVersionDto) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
