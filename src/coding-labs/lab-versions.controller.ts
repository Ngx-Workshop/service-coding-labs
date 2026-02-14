import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateDraftVersionDto,
  UpdateDraftVersionDto,
} from './dto/create-draft-version.dto';
import { PublishVersionDto } from './dto/publish-version.dto';
import { LabVersionsService } from './lab-versions.service';
import { HandsOnLabVersionMongo } from './schemas/hands_on_lab_versions.schema';

@ApiTags('Lab Versions')
@Controller('labs/:labId/versions')
export class LabVersionsController {
  constructor(private readonly labVersionsService: LabVersionsService) {}

  @Post('draft')
  @ApiCreatedResponse({ type: HandsOnLabVersionMongo })
  createDraft(
    @Param('labId') labId: string,
    @Body() createDraftVersionDto: CreateDraftVersionDto
  ) {
    return this.labVersionsService.createDraft(labId, createDraftVersionDto);
  }

  @Get()
  @ApiOkResponse({ type: HandsOnLabVersionMongo, isArray: true })
  findAll(@Param('labId') labId: string) {
    return this.labVersionsService.findAll(labId);
  }

  @Get(':versionId')
  @ApiOkResponse({ type: HandsOnLabVersionMongo })
  findOne(@Param('labId') labId: string, @Param('versionId') versionId: string) {
    return this.labVersionsService.findOne(labId, versionId);
  }

  @Patch(':versionId')
  @ApiOkResponse({ type: HandsOnLabVersionMongo })
  patchDraft(
    @Param('labId') labId: string,
    @Param('versionId') versionId: string,
    @Body() updateDraftVersionDto: UpdateDraftVersionDto
  ) {
    return this.labVersionsService.patchDraft(
      labId,
      versionId,
      updateDraftVersionDto
    );
  }

  @Post(':versionId/publish')
  @ApiOkResponse({ type: HandsOnLabVersionMongo })
  publish(
    @Param('labId') labId: string,
    @Param('versionId') versionId: string,
    @Body() publishVersionDto: PublishVersionDto
  ) {
    return this.labVersionsService.publish(labId, versionId, publishVersionDto);
  }
}
