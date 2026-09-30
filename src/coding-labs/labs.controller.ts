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
  Patch,
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
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { LabsService } from './labs.service';
import { HandsOnLabMongo } from './schemas/hands_on_labs.schema';

@ApiTags('Labs')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Valid platform authentication required',
})
@ApiForbiddenResponse({ description: 'Administrator role required' })
@UseGuards(CodingLabsAdminGuard)
@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Post()
  @ApiCreatedResponse({ type: HandsOnLabMongo })
  create(@Body() createLabDto: CreateLabDto) {
    return this.labsService.create(createLabDto);
  }

  @Get()
  @ApiOkResponse({ type: HandsOnLabMongo, isArray: true })
  @ApiQuery({ name: 'workshopId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'tag', required: false, type: String })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  findAll(
    @Query('workshopId') workshopId?: string,
    @Query('status') status?: string,
    @Query('tag') tag?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.labsService.findAll({
      workshopId,
      status,
      tag,
      q,
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }

  @Get(':labId')
  @ApiOkResponse({ type: HandsOnLabMongo })
  findOne(@Param('labId', MongoIdPipe) labId: string) {
    return this.labsService.findOne(labId);
  }

  @Patch(':labId')
  @ApiOkResponse({ type: HandsOnLabMongo })
  update(
    @Param('labId', MongoIdPipe) labId: string,
    @Body() updateLabDto: UpdateLabDto,
    @Req() request: { user: { sub: string } }
  ) {
    return this.labsService.update(labId, {
      ...updateLabDto,
      updatedBy: request.user.sub,
    });
  }

  @Delete(':labId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(
    @Param('labId', MongoIdPipe) labId: string,
    @Req() request: { user: { sub: string } }
  ) {
    await this.labsService.archive(labId, request.user.sub);
  }
}
