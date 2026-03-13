import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../auth.constants';
import { AuthTokenService } from '../auth-token.service';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is required.');
    }

    const [scheme, token, ...extraParts] = authorizationHeader.split(' ');
    if (
      extraParts.length > 0 ||
      !scheme ||
      scheme.toLowerCase() !== 'bearer' ||
      !token
    ) {
      throw new UnauthorizedException('Authorization header must be Bearer <token>.');
    }

    request.authTokenPayload = this.authTokenService.verify(token);
    return true;
  }
}
