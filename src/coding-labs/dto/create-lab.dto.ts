import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { LabStatus } from '../../collection-interfaces';

const LAB_STATUSES: LabStatus[] = ['draft', 'published', 'archived'];

export class CreateLabDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workshopId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workshopDocumentGroupId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ enum: ['intro', 'easy', 'medium', 'hard'] })
  @IsIn(['intro', 'easy', 'medium', 'hard'])
  @IsOptional()
  difficulty?: 'intro' | 'easy' | 'medium' | 'hard';

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  @IsOptional()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ enum: LAB_STATUSES, default: 'draft' })
  @IsIn(LAB_STATUSES)
  @IsOptional()
  status?: LabStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  updatedBy?: string;
}
