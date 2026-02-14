import { Module } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { LabEmbedsController } from './lab-embeds.controller';
import { LabEmbedsService } from './lab-embeds.service';
import { LabVersionsController } from './lab-versions.controller';
import { LabVersionsService } from './lab-versions.service';
import { LabsController } from './labs.controller';
import { LabsService } from './labs.service';
import {
  HandsOnLabEmbedMongo,
  HandsOnLabEmbedSchema,
} from './schemas/hands_on_lab_embeds.schema';
import {
  HandsOnLabVersionMongo,
  HandsOnLabVersionSchema,
} from './schemas/hands_on_lab_versions.schema';
import { HandsOnLabMongo, HandsOnLabSchema } from './schemas/hands_on_labs.schema';

const SCHEMA_IMPORTS =
  process.env.GENERATE_OPENAPI === 'true'
    ? []
    : [
        MongooseModule.forFeature([
          { name: HandsOnLabMongo.name, schema: HandsOnLabSchema },
          {
            name: HandsOnLabVersionMongo.name,
            schema: HandsOnLabVersionSchema,
          },
          {
            name: HandsOnLabEmbedMongo.name,
            schema: HandsOnLabEmbedSchema,
          },
        ]),
      ];

const FAKE_PROVIDERS =
  process.env.GENERATE_OPENAPI === 'true'
    ? [
        {
          provide: getModelToken(HandsOnLabMongo.name),
          useValue: {
            find: () => ({ sort: () => ({ limit: () => ({ skip: () => ({ exec: async () => [] }) }) }) }),
            findById: () => ({ exec: async () => null }),
            findByIdAndUpdate: () => ({ exec: async () => null }),
            exists: async () => null,
            findOne: () => ({ sort: () => ({ exec: async () => null }) }),
          },
        },
        {
          provide: getModelToken(HandsOnLabVersionMongo.name),
          useValue: {
            find: () => ({ sort: () => ({ exec: async () => [] }) }),
            findOne: () => ({ sort: () => ({ exec: async () => null }) }),
            findByIdAndUpdate: () => ({ exec: async () => null }),
          },
        },
        {
          provide: getModelToken(HandsOnLabEmbedMongo.name),
          useValue: {
            find: () => ({ sort: () => ({ exec: async () => [] }) }),
            findByIdAndDelete: () => ({ exec: async () => null }),
          },
        },
      ]
    : [];

@Module({
  imports: [...SCHEMA_IMPORTS],
  controllers: [LabsController, LabVersionsController, LabEmbedsController],
  providers: [LabsService, LabVersionsService, LabEmbedsService, ...FAKE_PROVIDERS],
})
export class CodingLabsModule {}
