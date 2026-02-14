import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CodingLabsModule } from './coding-labs/coding-labs.module';

const DB_IMPORTS =
  process.env.GENERATE_OPENAPI === 'true'
    ? []
    : [
        MongooseModule.forRootAsync({
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => ({
            uri: config.get<string>('MONGODB_URI'),
            serverSelectionTimeoutMS: 5000, // Timeout in 5 seconds
          }),
        }),
      ];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ...DB_IMPORTS,
    CodingLabsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
