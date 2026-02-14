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
  findOne(@Param('labId') labId: string) {
    return this.labsService.findOne(labId);
  }

  @Patch(':labId')
  @ApiOkResponse({ type: HandsOnLabMongo })
  update(@Param('labId') labId: string, @Body() updateLabDto: UpdateLabDto) {
    return this.labsService.update(labId, updateLabDto);
  }

  @Delete(':labId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(
    @Param('labId') labId: string,
    @Query('archivedBy') archivedBy?: string
  ) {
    await this.labsService.archive(labId, archivedBy);
  }
}
