import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';
import { PublishedLabDto } from './published-labs.controller';
import { TestResultDto } from './dto/verification.dto';
export class LabSummaryDto {
  @ApiProperty() labId: string;
  @ApiProperty() title: string;
  @ApiProperty() summary: string;
  @ApiProperty() slug: string;
  @ApiProperty() workshopId: string;
  @ApiProperty({ type: [String] }) tags: string[];
  @ApiPropertyOptional() difficulty?: string;
  @ApiPropertyOptional() estimatedMinutes?: number;
}
export class GradeLabDto {
  @ApiProperty() @IsMongoId() versionId: string;
  @ApiProperty({ maxLength: 50000 })
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  code: string;
}
export class LabGradeDto {
  @ApiProperty() passed: boolean;
  @ApiProperty() totalTests: number;
  @ApiProperty() passedTests: number;
  @ApiProperty() durationMs: number;
  @ApiProperty({ type: [TestResultDto] }) results: TestResultDto[];
}
export { PublishedLabDto };
