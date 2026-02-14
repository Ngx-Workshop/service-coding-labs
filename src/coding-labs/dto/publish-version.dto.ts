import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PublishVersionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  publishedBy: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
