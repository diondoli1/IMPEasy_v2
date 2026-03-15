import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY, ROLES_KEY, type FixedRole } from '../auth.constants';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<FixedRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authTokenPayload = request.authTokenPayload;

    if (!authTokenPayload) {
      throw new UnauthorizedException('Authenticated user context is required.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: authTokenPayload.sub,
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new ForbiddenException('User is not active.');
    }

    const userRoleNames = user.userRoles.map((userRole) => userRole.role.name.toLowerCase());

    if (userRoleNames.includes('admin')) {
      return true;
    }

    // Operator: allow access when route requires operator (kiosk needs workstations, manufacturing-orders)
    // Check both metadata and path as fallback (metadata can be undefined in some NestJS setups)
    const path = ((request as { path?: string }).path ?? String(request.url ?? '').split('?')[0]) || '';
    const method = (request.method ?? 'GET').toUpperCase();
    const isKioskRoute =
      (path === '/manufacturing-orders' ||
        path === '/workstations' ||
        path.startsWith('/manufacturing-orders/') ||
        path.startsWith('/workstations/') ||
        path === '/operations/queue' ||
        path.startsWith('/operations/')) &&
      (method === 'GET' || (path.startsWith('/operations/') && ['POST', 'PATCH'].includes(method)));
    const routeRequiresOperator =
      (requiredRoles && requiredRoles.some((r) => r === 'operator')) || isKioskRoute;
    if (userRoleNames.includes('operator') && routeRequiresOperator) {
      return true;
    }

    // Map office/planner to admin for backward compatibility (UX spec: Admin & Operator only)
    const effectiveRoles = userRoleNames.includes('office') || userRoleNames.includes('planner')
      ? [...userRoleNames, 'admin']
      : userRoleNames;

    const hasRequiredRole = requiredRoles.some((requiredRole) =>
      effectiveRoles.includes(requiredRole),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient role permissions for this route.');
    }

    return true;
  }
}
