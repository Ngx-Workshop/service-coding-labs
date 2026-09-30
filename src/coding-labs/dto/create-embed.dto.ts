import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmbedDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  labId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workshopId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workshopDocumentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  blockId: string;

  @ApiPropertyOptional({ enum: ['handsOnLab'], default: 'handsOnLab' })
  @IsIn(['handsOnLab'])
  @IsOptional()
  blockType?: 'handsOnLab';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsMongoId()
  pinnedVersionId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
