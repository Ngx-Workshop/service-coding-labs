import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestResultDto {
  @ApiProperty() name: string;
  @ApiProperty({ enum: ['sample', 'hidden'] }) suite: 'sample' | 'hidden';
  @ApiProperty({ enum: ['passed', 'failed', 'error', 'timeout'] }) status:
    | 'passed'
    | 'failed'
    | 'error'
    | 'timeout';
  @ApiProperty() durationMs: number;
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
  actual?: unknown;
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
  expected?: unknown;
  @ApiPropertyOptional() message?: string;
}

export class VerificationDto {
  @ApiProperty() passed: boolean;
  @ApiProperty() contentHash: string;
  @ApiProperty() totalTests: number;
  @ApiProperty() passedTests: number;
  @ApiProperty() durationMs: number;
  @ApiProperty({ type: [TestResultDto] }) results: TestResultDto[];
}
