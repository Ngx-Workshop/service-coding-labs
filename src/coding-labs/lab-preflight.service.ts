import { Injectable } from '@nestjs/common';
import { ChallengeRunnerService } from './challenge-runner.service';
import { draftContent } from './draft-content';
import { PreflightLabDto } from './dto/preflight.dto';
import { HandsOnLabVersionMongo } from './schemas/hands_on_lab_versions.schema';

@Injectable()
export class LabPreflightService {
  constructor(private readonly runner: ChallengeRunnerService) {}

  verify(dto: PreflightLabDto) {
    const version = Object.assign(
      new HandsOnLabVersionMongo(),
      draftContent(dto, {})
    );
    return this.runner.verify(version);
  }
}
