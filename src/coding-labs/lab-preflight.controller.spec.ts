import { Test } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthClientService } from '@tmdjr/ngx-auth-client';
import request = require('supertest');
import { LabPreflightController } from './lab-preflight.controller';
import { LabVersionsService } from './lab-versions.service';
import { CodingLabsAdminGuard } from './admin.guard';
import { ChallengeRunnerService } from './challenge-runner.service';
import { initialContent, validateChallenge } from './challenge-content';
import { HandsOnLabVersionMongo } from './schemas/hands_on_lab_versions.schema';

describe('admin lab preflight HTTP boundary', () => {
  let app: INestApplication;
  const verify = jest.fn(async (version: HandsOnLabVersionMongo) => {
    validateChallenge(version);
    return {
      passed: true,
      contentHash: 'checked',
      totalTests: 2,
      passedTests: 2,
      durationMs: 1,
      results: [],
    };
  });
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [LabPreflightController],
      providers: [
        CodingLabsAdminGuard,
        {
          provide: AuthClientService,
          useValue: {
            validateAccessToken: (req: {
              headers: { authorization?: string };
              user?: unknown;
            }) => {
              if (!req.headers.authorization) throw new UnauthorizedException();
              req.user = {
                sub: 'test',
                role:
                  req.headers.authorization === 'Bearer admin'
                    ? 'admin'
                    : 'learner',
              };
            },
          },
        },
        {
          provide: LabVersionsService,
          useFactory: () =>
            new LabVersionsService(
              // Any persistence access fails this test: preflight must be pure authoring execution.
              new Proxy(
                {},
                {
                  get: () => {
                    throw new Error('Unexpected database access');
                  },
                }
              ) as never,
              new Proxy(
                {},
                {
                  get: () => {
                    throw new Error('Unexpected database access');
                  },
                }
              ) as never,
              { verify } as unknown as ChallengeRunnerService
            ),
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  it('requires administrator credentials', async () => {
    await request(app.getHttpServer())
      .post('/lab-preflight')
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post('/lab-preflight')
      .set('Authorization', 'Bearer learner')
      .send({})
      .expect(403);
  });
  it('verifies unsaved JSON test data without touching a model or database', async () => {
    const value = {
      ...initialContent,
      referenceSolution: {
        code: 'function solve(input) { return input.reduce((a,b) => a+b,0); }',
      },
    };
    await request(app.getHttpServer())
      .post('/lab-preflight')
      .set('Authorization', 'Bearer admin')
      .send(value)
      .expect(200);
    expect(verify).toHaveBeenCalledWith(
      expect.objectContaining({
        sampleTests: [expect.objectContaining({ input: [1, 2, 3] })],
      })
    );
  });
  it('rejects audit injection and incomplete or non-executable tests', async () => {
    await request(app.getHttpServer())
      .post('/lab-preflight')
      .set('Authorization', 'Bearer admin')
      .send({ ...initialContent, createdBy: 'forged' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/lab-preflight')
      .set('Authorization', 'Bearer admin')
      .send({})
      .expect(400);
    const value = {
      ...initialContent,
      referenceSolution: { code: 'function solve(input) { return 0; }' },
      sampleTests: [
        { name: 'unit', kind: 'unit', testCode: 'expect(1).toBe(1)' },
      ],
    };
    await request(app.getHttpServer())
      .post('/lab-preflight')
      .set('Authorization', 'Bearer admin')
      .send(value)
      .expect(400);
  });
});
