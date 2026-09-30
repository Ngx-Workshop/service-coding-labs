import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { VerificationDto } from './dto/verification.dto';
import { UseGuards, Req, HttpCode } from '@nestjs/common';
import { CodingLabsAdminGuard } from './admin.guard';
import { MongoIdPipe } from './mongo-id.pipe';
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
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Valid platform authentication required',
})
@ApiForbiddenResponse({ description: 'Administrator role required' })
@UseGuards(CodingLabsAdminGuard)
@Controller('labs/:labId/versions')
export class LabVersionsController {
  constructor(private readonly labVersionsService: LabVersionsService) {}

  @Post('draft')
  @ApiCreatedResponse({ type: HandsOnLabVersionMongo })
  createDraft(
    @Param('labId', MongoIdPipe) labId: string,
    @Body() createDraftVersionDto: CreateDraftVersionDto
  ) {
    return this.labVersionsService.createDraft(labId, createDraftVersionDto);
  }

  @Get()
  @ApiOkResponse({ type: HandsOnLabVersionMongo, isArray: true })
  findAll(@Param('labId', MongoIdPipe) labId: string) {
    return this.labVersionsService.findAll(labId);
  }

  @Get(':versionId')
  @ApiOkResponse({ type: HandsOnLabVersionMongo })
  findOne(
    @Param('labId', MongoIdPipe) labId: string,
    @Param('versionId', MongoIdPipe) versionId: string
  ) {
    return this.labVersionsService.findOne(labId, versionId);
  }

  @Patch(':versionId')
  @ApiOkResponse({ type: HandsOnLabVersionMongo })
  patchDraft(
    @Param('labId', MongoIdPipe) labId: string,
    @Param('versionId', MongoIdPipe) versionId: string,
    @Body() updateDraftVersionDto: UpdateDraftVersionDto
  ) {
    return this.labVersionsService.patchDraft(
      labId,
      versionId,
      updateDraftVersionDto
    );
  }

  @Post(':versionId/verify')
  @HttpCode(200)
  @ApiOkResponse({ type: VerificationDto })
  verify(
    @Param('labId', MongoIdPipe) labId: string,
    @Param('versionId', MongoIdPipe) versionId: string
  ) {
    return this.labVersionsService.verify(labId, versionId);
  }

  @Post(':versionId/publish')
  @HttpCode(200)
  @ApiOkResponse({ type: HandsOnLabVersionMongo })
  publish(
    @Param('labId', MongoIdPipe) labId: string,
    @Param('versionId', MongoIdPipe) versionId: string,
    @Body() publishVersionDto: PublishVersionDto
  ) {
    return this.labVersionsService.publish(labId, versionId, publishVersionDto);
  }
}
