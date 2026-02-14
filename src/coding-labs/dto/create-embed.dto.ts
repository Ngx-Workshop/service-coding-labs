import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmbedDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
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
  pinnedVersionId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
