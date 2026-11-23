import type { Server } from 'node:http';
import {
  Controller,
  Get,
  INestApplication,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Match callable Supertest in CommonJS service builds.
import request = require('supertest');
import { ObservabilityModule } from './observability.module';
import { createServiceLogger, httpLoggingMiddleware } from './observability';
import { observeDomainOperation, requestContext } from './domain-operation';

@Controller('items')
class TestController {
  @Get(':id')
  async get() {
    return observeDomainOperation(
      new Logger('TestDomain'),
      'lab_published',
      async () => {
        await new Promise<void>((resolve) => setImmediate(resolve));
        return { ok: true, requestId: requestContext.getStore()?.requestId };
      }
    );
  }
}

describe('Service observability', () => {
  let app: INestApplication<Server>;
  const log = jest.fn();
  const warn = jest.fn();
  const error = jest.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ObservabilityModule],
      controllers: [TestController],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.use(httpLoggingMiddleware({ log, warn, error } as unknown as Logger));
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serves an anonymous, non-cached heartbeat without database or auth providers', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({
      status: 'ok',
      info: { heartbeat: { status: 'up' } },
      error: {},
      details: { heartbeat: { status: 'up' } },
    });
    expect(log).not.toHaveBeenCalled();
    await request(app.getHttpServer()).head('/health').expect(200);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('logs route templates and timings without request data or concrete identifiers', async () => {
    const response = await request(app.getHttpServer())
      .get('/items/private-person?token=private-query')
      .set('Authorization', 'Bearer private-auth')
      .set('Cookie', 'session=private-cookie')
      .expect(200);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http_request',
        method: 'GET',
        route: '/items/:id',
        statusCode: 200,
        durationMs: expect.any(Number) as unknown,
        requestId: response.headers['x-request-id'],
      })
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-');
  });

  it('logs unknown routes without their raw paths or query values', async () => {
    await request(app.getHttpServer())
      .get('/private-missing?secret=private-query')
      .expect(404);
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/unmatched', statusCode: 404 })
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('private-');
  });

  it('does not provide a write endpoint for heartbeat', async () => {
    await request(app.getHttpServer())
      .post('/health')
      .send({ secret: 'private-body' })
      .expect(404);
    expect(warn).toHaveBeenCalled();
    expect(JSON.stringify(warn.mock.calls)).not.toContain('private-body');
  });

  it('uses native Nest JSON logging with a contextual, structured message', () => {
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    try {
      createServiceLogger().log({ event: 'test_event' }, 'ObservabilityTest');
      expect(write).toHaveBeenCalled();
      const entry: unknown = JSON.parse(String(write.mock.calls[0][0]));
      expect(entry).toEqual(
        expect.objectContaining({
          level: 'log',
          context: 'ObservabilityTest',
          message: { event: 'test_event' },
        })
      );
    } finally {
      write.mockRestore();
    }
  });
  it('isolates concurrent domain context and ignores untrusted incoming IDs', async () => {
    const domainLog = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => {});
    try {
      const responses = await Promise.all(
        [1, 2].map((id) =>
          request(app.getHttpServer())
            .get(`/items/private-${id}`)
            .set('X-Request-ID', 'private-untrusted-id')
            .expect(200)
        )
      );
      const ids = responses.map((response) => response.headers['x-request-id']);
      expect(new Set(ids).size).toBe(2);
      responses.forEach((response, index) => {
        const body: unknown = response.body;
        expect(body).toEqual(
          expect.objectContaining({ requestId: ids[index] })
        );
        expect(domainLog).toHaveBeenCalledWith(
          expect.objectContaining({
            requestId: ids[index],
            event: 'lab_published',
          })
        );
      });
      expect(JSON.stringify(domainLog.mock.calls)).not.toContain('private-');
      expect(requestContext.getStore()).toBeUndefined();
    } finally {
      domainLog.mockRestore();
    }
  });

  it('emits native safe success/failure JSON and records a nested failure only once', async () => {
    const stdout = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const stderr = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    const logger = createServiceLogger();
    logger.setContext('DomainTest');
    const failure = new ServiceUnavailableException(
      'private-canary code, hidden test and credential'
    );
    try {
      await observeDomainOperation(
        logger,
        'challenge_verification',
        () => Promise.resolve({ passed: true, totalTests: 2, passedTests: 2 }),
        (result) => result
      );
      const success: unknown = JSON.parse(String(stdout.mock.calls[0][0]));
      expect(success).toEqual(
        expect.objectContaining({
          level: 'log',
          context: 'DomainTest',
          message: expect.objectContaining({
            event: 'challenge_verification',
            outcome: 'success',
            totalTests: 2,
            passedTests: 2,
            runId: expect.any(String) as unknown,
            durationMs: expect.any(Number) as unknown,
          }) as unknown,
        })
      );
      await expect(
        observeDomainOperation(logger, 'lab_published', () =>
          observeDomainOperation(logger, 'challenge_verification', () =>
            Promise.reject(failure)
          )
        )
      ).rejects.toBe(failure);
      expect(stderr).toHaveBeenCalledTimes(1);
      const failed: unknown = JSON.parse(String(stderr.mock.calls[0][0]));
      expect(failed).toEqual(
        expect.objectContaining({
          level: 'error',
          context: 'DomainTest',
          message: expect.objectContaining({
            outcome: 'failure',
            statusCode: 503,
          }) as unknown,
        })
      );
      expect(
        JSON.stringify([stdout.mock.calls, stderr.mock.calls])
      ).not.toContain('private-canary');
      const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      await observeDomainOperation(
        logger,
        'challenge_verification',
        () => Promise.resolve({ passed: false, totalTests: 2, passedTests: 1 }),
        (result) => result
      );
      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'failed' })
      );
      warn.mockRestore();
    } finally {
      stdout.mockRestore();
      stderr.mockRestore();
    }
  });
});
