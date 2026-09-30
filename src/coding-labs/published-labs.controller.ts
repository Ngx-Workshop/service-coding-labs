import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LabVersionsService } from './lab-versions.service';
import { MongoIdPipe } from './mongo-id.pipe';
import { LabTestCaseDto } from './dto/create-draft-version.dto';

export class PublishedLabDto {
  @ApiProperty() labId: string;
  @ApiProperty() versionId: string;
  @ApiProperty() versionNumber: number;
  @ApiProperty() title: string;
  @ApiPropertyOptional({ enum: ['intro', 'easy', 'medium', 'hard'] })
  difficulty?: string;
  @ApiProperty({ enum: ['javascript', 'typescript'] }) language: string;
  @ApiProperty() promptMarkdown: string;
  @ApiProperty({ type: [String] }) hints: string[];
  @ApiProperty() starterCode: string;
  @ApiProperty({ type: [LabTestCaseDto] }) sampleTests: LabTestCaseDto[];
  @ApiPropertyOptional() entryFnName?: string;
}

// Public, explicitly redacted published content. No authoring objects escape.
@ApiTags('Published labs')
@Controller('published-labs')
export class PublishedLabsController {
  constructor(private readonly versions: LabVersionsService) {}

  @Get(':labId')
  @ApiQuery({ name: 'versionId', required: false })
  @ApiOkResponse({ type: PublishedLabDto })
  get(
    @Param('labId', MongoIdPipe) labId: string,
    @Query('versionId') versionId?: string
  ) {
    if (versionId !== undefined && !/^[a-f\d]{24}$/i.test(versionId))
      throw new BadRequestException('Invalid version identifier');
    return this.versions.learnerContent(labId, versionId);
  }
}
