import { Test } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { AuthClientService } from '@tmdjr/ngx-auth-client';
import { Connection } from 'mongoose';
import * as request from 'supertest';
import { randomUUID } from 'node:crypto';
import { ChallengeRunnerService } from '../src/coding-labs/challenge-runner.service';

describe('Coding labs HTTP contract (disposable local Mongo database)', () => {
  let app: INestApplication;
  let connection: Connection;
  const dbName = 'coding_labs_test_' + randomUUID().replace(/-/g, '');
  const runner = { verify: jest.fn() };
  beforeAll(async () => {
    delete process.env.CODING_LABS_LOCAL_DEV;
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/' + dbName;
    const { AppModule } = await import('../src/app.module');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuthClientService)
      .useValue({
        validateAccessToken: async (req) => {
          if (!req.headers.authorization) throw new UnauthorizedException();
          req.user = {
            sub: 'authenticated-author',
            role:
              req.headers.authorization === 'Bearer admin'
                ? 'admin'
                : 'regular',
          };
          return true;
        },
      })
      .overrideProvider(ChallengeRunnerService)
      .useValue(runner)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
    );
    await app.init();
    connection = app.get(getConnectionToken());
  });
  afterAll(async () => {
    if (connection?.name === dbName) await connection.dropDatabase();
    await app?.close();
  });
  const admin = () => request(app.getHttpServer());
  let labId: string;
  let draft: any;
  it('denies anonymous and non-admin requests', async () => {
    await admin().get('/labs').expect(401);
    await admin()
      .get('/labs')
      .set('Authorization', 'Bearer regular')
      .expect(403);
  });
  it('validates IDs and pagination; search text is literal', async () => {
    await admin()
      .get('/labs/not-an-id')
      .set('Authorization', 'Bearer admin')
      .expect(400);
    await admin()
      .get('/labs?limit=-1')
      .set('Authorization', 'Bearer admin')
      .expect(400);
    await admin()
      .get('/labs?q=%5B')
      .set('Authorization', 'Bearer admin')
      .expect(200);
  });
  it('creates a recoverable initial draft and overwrites forged audit identity', async () => {
    const lab = await admin()
      .post('/labs')
      .set('Authorization', 'Bearer admin')
      .send({
        title: 'HTTP test',
        slug: 'http-test',
        workshopId: 'test',
        createdBy: 'forged',
      })
      .expect(201);
    labId = lab.body._id;
    expect(lab.body.createdBy).toBe('authenticated-author');
    draft = (
      await admin()
        .post('/labs/' + labId + '/versions/draft')
        .set('Authorization', 'Bearer admin')
        .send({ createdBy: 'forged' })
        .expect(201)
    ).body;
    expect(draft.sampleTests.length).toBe(1);
    const again = await admin()
      .post('/labs/' + labId + '/versions/draft')
      .set('Authorization', 'Bearer admin')
      .send({ createdBy: 'forged' })
      .expect(201);
    expect(again.body._id).toBe(draft._id);
  });
  it('persists null JSON, allows incomplete references and rejects stale saves', async () => {
    const url = '/labs/' + labId + '/versions/' + draft._id;
    const stale = draft.contentHash;
    draft = (
      await admin()
        .patch(url)
        .set('Authorization', 'Bearer admin')
        .send({
          createdBy: 'author',
          expectedContentHash: draft.contentHash,
          referenceSolution: { code: '' },
          sampleTests: [
            {
              name: 'null',
              kind: 'io',
              input: null,
              expected: null,
              comparator: { kind: 'deepEqual' },
            },
          ],
        })
        .expect(200)
    ).body;
    expect(draft.sampleTests[0].expected).toBeNull();
    await admin()
      .patch(url)
      .set('Authorization', 'Bearer admin')
      .send({
        createdBy: 'author',
        expectedContentHash: stale,
        promptMarkdown: 'stale',
      })
      .expect(409);
    const versions = await admin()
      .get('/labs/' + labId + '/versions')
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(versions.body.length).toBe(1);
  });
  it('gates publication on backend verification and redacts learner content', async () => {
    const url = '/labs/' + labId + '/versions/' + draft._id;
    runner.verify.mockResolvedValue({ passed: false });
    await admin()
      .post(url + '/publish')
      .set('Authorization', 'Bearer admin')
      .send({ publishedBy: 'a', expectedContentHash: draft.contentHash })
      .expect(400);
    runner.verify.mockResolvedValue({
      passed: true,
      contentHash: draft.contentHash,
    });
    await admin()
      .post(url + '/publish')
      .set('Authorization', 'Bearer admin')
      .send({ publishedBy: 'a', expectedContentHash: draft.contentHash })
      .expect(200);
    await admin()
      .patch(url)
      .set('Authorization', 'Bearer admin')
      .send({ createdBy: 'a', expectedContentHash: draft.contentHash })
      .expect(400);
    const publicResponse = await admin()
      .get('/published-labs/' + labId)
      .expect(200);
    expect(publicResponse.body).not.toHaveProperty('hiddenTests');
    expect(publicResponse.body).not.toHaveProperty('referenceSolution');
    expect(publicResponse.body.sampleTests[0].expected).toBeNull();
  });
  it('clones the publication and blocks publication status bypass', async () => {
    const next = await admin()
      .post('/labs/' + labId + '/versions/draft')
      .set('Authorization', 'Bearer admin')
      .send({ createdBy: 'a' })
      .expect(201);
    expect(next.body.versionNumber).toBe(2);
    expect(next.body.sampleTests).toEqual(draft.sampleTests);
    await admin()
      .patch('/labs/' + labId)
      .set('Authorization', 'Bearer admin')
      .send({ status: 'published' })
      .expect(400);
  });
});
