import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from '../src/auth/guards/roles.guard';

function createExecutionContext(
  request: Record<string, unknown>,
): ExecutionContext {
  return {
    getClass: () => class RolesGuardTestClass {},
    getHandler: () => (() => undefined) as (...args: unknown[]) => unknown,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard (e2e)', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const guard = new RolesGuard(reflector, prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows requests without role requirements', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(undefined);

    const canActivate = await guard.canActivate(
      createExecutionContext({
        authTokenPayload: {
          sub: 1,
          email: 'admin@impeasy.test',
        },
      }),
    );

    expect(canActivate).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows admin users regardless of required role', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['planner']);
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
      userRoles: [
        {
          role: {
            name: 'admin',
          },
        },
      ],
    });

    const canActivate = await guard.canActivate(
      createExecutionContext({
        authTokenPayload: {
          sub: 1,
          email: 'admin@impeasy.test',
        },
      }),
    );

    expect(canActivate).toBe(true);
  });

  it('rejects users without the required role', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['office']);
    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      isActive: true,
      userRoles: [
        {
          role: {
            name: 'planner',
          },
        },
      ],
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          authTokenPayload: {
            sub: 2,
            email: 'planner@impeasy.test',
          },
        }),
      ),
    ).rejects.toThrow('Insufficient role permissions for this route.');
  });
});
