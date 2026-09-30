import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNumber,
  ArrayMaxSize,
  MaxLength,
  Matches,
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
  @ApiProperty({
    enum: [
      'deepEqual',
      'strictEqual',
      'numberTolerance',
      'stringNormalized',
      'custom',
    ],
  })
  @IsIn([
    'deepEqual',
    'strictEqual',
    'numberTolerance',
    'stringNormalized',
    'custom',
  ])
  kind:
    | 'deepEqual'
    | 'strictEqual'
    | 'numberTolerance'
    | 'stringNormalized'
    | 'custom';

  @ApiPropertyOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
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

  @ApiPropertyOptional({
    nullable: true,
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: {} },
      { type: 'object', additionalProperties: true },
    ],
  })
  @ValidateIf((o) => o.kind === 'io' && o.input === undefined)
  @IsDefined()
  input?: unknown;

  @ApiPropertyOptional({
    nullable: true,
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: {} },
      { type: 'object', additionalProperties: true },
    ],
  })
  @ValidateIf((o) => o.kind === 'io' && o.expected === undefined)
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
  @Max(10000)
  timeoutMs: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(64)
  @Max(512)
  @IsOptional()
  memoryMb?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z_$][\w$]*$/)
  entryFnName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nodeVersion?: string;
}

export class ReferenceSolutionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50000)
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
  @ArrayMaxSize(50)
  sampleTests?: LabTestCaseDto[];

  @ApiPropertyOptional({ type: () => [LabTestCaseDto] })
  @ValidateNested({ each: true })
  @Type(() => LabTestCaseDto)
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(50)
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
  @ApiProperty({
    description: 'Hash from the loaded draft; prevents stale overwrites',
  })
  @IsString()
  @IsNotEmpty()
  expectedContentHash: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
