import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiServiceUnavailableResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CodingLabsAdminGuard } from './admin.guard';
import { PreflightLabDto } from './dto/preflight.dto';
import { VerificationDto } from './dto/verification.dto';
import { LabVersionsService } from './lab-versions.service';

@ApiTags('Lab preflight')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Valid platform authentication required',
})
@ApiForbiddenResponse({ description: 'Administrator role required' })
@UseGuards(CodingLabsAdminGuard)
@Controller('lab-preflight')
export class LabPreflightController {
  constructor(private readonly versions: LabVersionsService) {}

  @ApiBadRequestResponse({
    description: 'Incomplete or unsupported challenge content',
  })
  @ApiTooManyRequestsResponse({
    description: 'Isolated verification is at capacity',
  })
  @ApiServiceUnavailableResponse({
    description: 'Isolated runner or execution image unavailable',
  })
  @Post()
  @HttpCode(200)
  @ApiOkResponse({
    type: VerificationDto,
    description: 'Isolated verification without creating or changing a lab',
  })
  verify(@Body() value: PreflightLabDto) {
    return this.versions.preflight(value);
  }
}
