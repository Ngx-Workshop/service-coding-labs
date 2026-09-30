import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateLabDto } from './create-lab.dto';

// Ownership and publication state are not editable metadata.
export class UpdateLabDto extends PartialType(
  OmitType(CreateLabDto, ['createdBy', 'status', 'workshopId'] as const)
) {}
