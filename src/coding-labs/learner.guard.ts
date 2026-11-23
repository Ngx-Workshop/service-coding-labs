import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthClientService } from '@tmdjr/ngx-auth-client';
import type { Request } from 'express';

@Injectable()
export class CodingLabsLearnerGuard implements CanActivate {
  constructor(private readonly auth: AuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.auth.validateAccessToken(
      context.switchToHttp().getRequest<Request>()
    );
    return true;
  }
}
