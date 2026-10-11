import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Injectable,
  CanActivate,
  ExecutionContext,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthClientService } from '@tmdjr/ngx-auth-client';
import { MongoIdPipe } from './mongo-id.pipe';
import { LabVersionsService } from './lab-versions.service';
import { GradeLabDto, LabGradeDto, LabSummaryDto } from './learner-labs.dto';
@Injectable()
export class CodingLabsLearnerGuard implements CanActivate {
  constructor(private readonly auth: AuthClientService) {}
  async canActivate(context: ExecutionContext) {
    await this.auth.validateAccessToken(context.switchToHttp().getRequest());
    return true;
  }
}
@ApiTags('Learner labs')
@Controller('published-labs')
export class LearnerLabsController {
  constructor(private readonly versions: LabVersionsService) {}
  @Get()
  @ApiOkResponse({ type: [LabSummaryDto] })
  catalog() {
    return this.versions.learnerCatalog();
  }
  @Post(':labId/grade')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(CodingLabsLearnerGuard)
  @ApiOkResponse({ type: LabGradeDto })
  grade(
    @Param('labId', MongoIdPipe) id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: GradeLabDto
  ) {
    return this.versions.gradeLearner(id, dto.versionId, dto.code);
  }
}
