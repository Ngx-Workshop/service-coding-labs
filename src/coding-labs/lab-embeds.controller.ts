import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UseGuards, Req } from '@nestjs/common';
import { CodingLabsAdminGuard } from './admin.guard';
import { MongoIdPipe } from './mongo-id.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEmbedDto } from './dto/create-embed.dto';
import { LabEmbedsService } from './lab-embeds.service';
import { HandsOnLabEmbedMongo } from './schemas/hands_on_lab_embeds.schema';

@ApiTags('Lab Embeds')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Valid platform authentication required',
})
@ApiForbiddenResponse({ description: 'Administrator role required' })
@UseGuards(CodingLabsAdminGuard)
@Controller('embeds')
export class LabEmbedsController {
  constructor(private readonly labEmbedsService: LabEmbedsService) {}

  @Post()
  @ApiCreatedResponse({ type: HandsOnLabEmbedMongo })
  create(@Body() createEmbedDto: CreateEmbedDto) {
    return this.labEmbedsService.create(createEmbedDto);
  }

  @Get()
  @ApiOkResponse({ type: HandsOnLabEmbedMongo, isArray: true })
  @ApiQuery({ name: 'labId', required: false, type: String })
  @ApiQuery({ name: 'workshopId', required: false, type: String })
  @ApiQuery({ name: 'workshopDocumentId', required: false, type: String })
  findAll(
    @Query('labId') labId?: string,
    @Query('workshopId') workshopId?: string,
    @Query('workshopDocumentId') workshopDocumentId?: string
  ) {
    return this.labEmbedsService.findAll({
      labId,
      workshopId,
      workshopDocumentId,
    });
  }

  @Delete(':embedId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('embedId', MongoIdPipe) embedId: string) {
    await this.labEmbedsService.remove(embedId);
  }
}
