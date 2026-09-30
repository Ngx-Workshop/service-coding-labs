import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { localDevelopmentEnabled } from './coding-labs/admin.guard';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.GENERATE_OPENAPI === 'true')
    throw new Error('Generation mode cannot serve requests');
  app.use(cookieParser());
  const origins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:4201,https://admin.ngx-workshop.io'
  )
    .split(',')
    .map((value) => value.trim());
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  );

  await app.listen(
    process.env.PORT ?? 3009,
    localDevelopmentEnabled() ? '127.0.0.1' : (process.env.HOST ?? '0.0.0.0')
  );
}
bootstrap();
