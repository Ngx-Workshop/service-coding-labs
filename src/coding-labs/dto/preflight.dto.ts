import { OmitType } from '@nestjs/swagger';
import { CreateDraftVersionDto } from './create-draft-version.dto';

// No persisted identity, content hash or caller-supplied audit actor.
export class PreflightLabDto extends OmitType(CreateDraftVersionDto, [
  'createdBy',
  'contentHash',
] as const) {}
