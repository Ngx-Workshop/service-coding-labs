import { CodingLabsAdminGuard } from './admin.guard';
describe('CodingLabsAdminGuard', () => {
  const auth = { validateAccessToken: jest.fn() };
  const guard = new CodingLabsAdminGuard(auth as any);
  const context = (request: any) =>
    ({ switchToHttp: () => ({ getRequest: () => request }) }) as any;
  beforeEach(() => {
    delete process.env.CODING_LABS_LOCAL_DEV;
    auth.validateAccessToken.mockReset();
  });
  it('requires remotely validated admin role and replaces forged actors', async () => {
    const req = { body: { createdBy: 'forged' }, user: undefined as any };
    auth.validateAccessToken.mockImplementation(async (request) => {
      request.user = { sub: 'real', role: 'admin' };
      return true;
    });
    expect(await guard.canActivate(context(req))).toBe(true);
    expect(req.body.createdBy).toBe('real');
  });
  it('rejects regular users', async () => {
    auth.validateAccessToken.mockImplementation(async (request) => {
      request.user = { role: 'regular' };
      return true;
    });
    await expect(guard.canActivate(context({}))).rejects.toThrow(
      'Administrator'
    );
  });
  it('does not trust local mode in production', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.CODING_LABS_LOCAL_DEV = 'true';
    auth.validateAccessToken.mockRejectedValue(new Error('No access token'));
    try {
      await expect(
        guard.canActivate(context({ socket: { remoteAddress: '127.0.0.1' } }))
      ).rejects.toThrow('No access token');
    } finally {
      process.env.NODE_ENV = previous;
      delete process.env.CODING_LABS_LOCAL_DEV;
    }
  });
});
