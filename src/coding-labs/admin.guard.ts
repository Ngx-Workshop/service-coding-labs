import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthClientService } from '@tmdjr/ngx-auth-client';

export function localDevelopmentEnabled(): boolean {
  return (
    process.env.CODING_LABS_LOCAL_DEV === 'true' &&
    process.env.NODE_ENV !== 'production'
  );
}

@Injectable()
export class CodingLabsAdminGuard implements CanActivate {
  constructor(private readonly auth: AuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const address = req.socket?.remoteAddress;
    if (
      localDevelopmentEnabled() &&
      ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)
    ) {
      const allowedOrigins = (
        process.env.CORS_ORIGINS ??
        'http://localhost:4201,https://admin.ngx-workshop.io'
      )
        .split(',')
        .map((value) => value.trim());
      if (req.headers?.origin && !allowedOrigins.includes(req.headers.origin))
        throw new ForbiddenException(
          'Origin is not allowed in local development'
        );
      req.user = { sub: 'local-admin', role: 'admin' };
    } else {
      await this.auth.validateAccessToken(req);
    }
    if (req.user?.role !== 'admin')
      throw new ForbiddenException('Administrator access required');
    // Audit identity is never supplied by the browser.
    for (const key of ['createdBy', 'updatedBy', 'publishedBy']) {
      if (req.body && key in req.body) req.body[key] = req.user.sub;
    }
    return true;
  }
}
