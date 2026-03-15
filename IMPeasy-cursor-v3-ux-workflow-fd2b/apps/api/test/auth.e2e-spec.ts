import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type UserRecord = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type RoleRecord = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserRoleRecord = {
  id: number;
  userId: number;
  roleId: number;
  createdAt: Date;
};

type UserLookupInput = {
  where: {
    id?: number;
    email?: string;
  };
  include?: {
    userRoles?: {
      include?: {
        role?: {
          select?: {
            name?: boolean;
          };
        };
      };
    };
  };
};

type UserFindManyInput = {
  include?: {
    userRoles?: {
      include?: {
        role?: {
          select?: {
            name?: boolean;
          };
        };
      };
    };
  };
  orderBy?: {
    id?: 'asc' | 'desc';
  };
};

type UserCreateInput = {
  data: {
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
  };
};

type RoleLookupInput = {
  where: {
    id?: number;
    name?: string;
  };
};

type RoleFindManyInput = {
  where?: {
    id?: {
      in?: number[];
    };
  };
  orderBy?: {
    id?: 'asc' | 'desc';
    name?: 'asc' | 'desc';
  };
};

type RoleCreateInput = {
  data: {
    name: string;
    description?: string | null;
  };
};

type UserRoleDeleteManyInput = {
  where: {
    userId: number;
  };
};

type UserRoleCreateManyInput = {
  data: Array<{
    userId: number;
    roleId: number;
  }>;
};

type UserWithRoleNames = UserRecord & {
  userRoles: Array<{
    role: {
      name: string;
    };
  }>;
};

class PrismaServiceMock {
  private users: UserRecord[] = [];
  private roles: RoleRecord[] = [];
  private userRoles: UserRoleRecord[] = [];
  private nextId = 1;
  private nextRoleId = 1;
  private nextUserRoleId = 1;

  private toUserWithRoleNames(user: UserRecord): UserWithRoleNames {
    const userRoles = this.userRoles
      .filter((candidate) => candidate.userId === user.id)
      .map((candidate) => this.roles.find((role) => role.id === candidate.roleId))
      .filter((candidate): candidate is RoleRecord => candidate !== undefined)
      .map((role) => ({
        role: {
          name: role.name,
        },
      }));

    return {
      ...user,
      userRoles,
    };
  }

  user = {
    findUnique: async ({ where, include }: UserLookupInput): Promise<UserRecord | UserWithRoleNames | null> => {
      if (where.id !== undefined) {
        const user = this.users.find((candidate) => candidate.id === where.id) ?? null;
        if (!user) {
          return null;
        }

        return include?.userRoles ? this.toUserWithRoleNames(user) : user;
      }

      if (where.email !== undefined) {
        const user = this.users.find((candidate) => candidate.email === where.email) ?? null;
        if (!user) {
          return null;
        }

        return include?.userRoles ? this.toUserWithRoleNames(user) : user;
      }

      return null;
    },
    findMany: async ({ include, orderBy }: UserFindManyInput = {}): Promise<Array<UserRecord | UserWithRoleNames>> => {
      const orderedUsers = [...this.users];
      if (orderBy?.id === 'desc') {
        orderedUsers.sort((left, right) => right.id - left.id);
      } else {
        orderedUsers.sort((left, right) => left.id - right.id);
      }

      if (include?.userRoles) {
        return orderedUsers.map((user) => this.toUserWithRoleNames(user));
      }

      return orderedUsers;
    },
    create: async ({ data }: UserCreateInput): Promise<UserRecord> => {
      const now = new Date();
      const created: UserRecord = {
        id: this.nextId++,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        isActive: data.isActive,
        createdAt: now,
        updatedAt: now,
      };

      this.users.push(created);
      return created;
    },
  };

  role = {
    findUnique: async ({ where }: RoleLookupInput): Promise<RoleRecord | null> => {
      if (where.id !== undefined) {
        return this.roles.find((candidate) => candidate.id === where.id) ?? null;
      }

      if (where.name !== undefined) {
        return this.roles.find((candidate) => candidate.name === where.name) ?? null;
      }

      return null;
    },
    findMany: async ({ where, orderBy }: RoleFindManyInput = {}): Promise<RoleRecord[]> => {
      let filtered = [...this.roles];

      const roleIds = where?.id?.in;
      if (roleIds) {
        const roleIdSet = new Set(roleIds);
        filtered = filtered.filter((candidate) => roleIdSet.has(candidate.id));
      }

      if (orderBy?.id === 'desc') {
        filtered.sort((left, right) => right.id - left.id);
      } else if (orderBy?.id === 'asc') {
        filtered.sort((left, right) => left.id - right.id);
      } else if (orderBy?.name === 'desc') {
        filtered.sort((left, right) => right.name.localeCompare(left.name));
      } else {
        filtered.sort((left, right) => left.name.localeCompare(right.name));
      }

      return filtered;
    },
    create: async ({ data }: RoleCreateInput): Promise<RoleRecord> => {
      const now = new Date();
      const created: RoleRecord = {
        id: this.nextRoleId++,
        name: data.name,
        description: data.description ?? null,
        createdAt: now,
        updatedAt: now,
      };

      this.roles.push(created);
      return created;
    },
  };

  userRole = {
    deleteMany: async ({ where }: UserRoleDeleteManyInput): Promise<{ count: number }> => {
      const beforeCount = this.userRoles.length;
      this.userRoles = this.userRoles.filter((candidate) => candidate.userId !== where.userId);
      return {
        count: beforeCount - this.userRoles.length,
      };
    },
    createMany: async ({ data }: UserRoleCreateManyInput): Promise<{ count: number }> => {
      let createdCount = 0;

      data.forEach((candidate) => {
        const alreadyExists = this.userRoles.some(
          (existing) =>
            existing.userId === candidate.userId && existing.roleId === candidate.roleId,
        );

        if (alreadyExists) {
          return;
        }

        this.userRoles.push({
          id: this.nextUserRoleId++,
          userId: candidate.userId,
          roleId: candidate.roleId,
          createdAt: new Date(),
        });
        createdCount += 1;
      });

      return {
        count: createdCount,
      };
    },
  };

  async $transaction<T>(callback: (prisma: PrismaServiceMock) => Promise<T>): Promise<T> {
    return callback(this);
  }
}

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(new PrismaServiceMock())
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers a user and rejects duplicate email registration', async () => {
    const registerResponse = await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Planner One',
      email: 'planner@impeasy.test',
      password: 'StrongPass1!',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toEqual(
      expect.objectContaining({
        id: 1,
        name: 'Planner One',
        email: 'planner@impeasy.test',
        isActive: true,
        roles: [],
      }),
    );

    const duplicateResponse = await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Planner Duplicate',
      email: 'planner@impeasy.test',
      password: 'StrongPass1!',
    });

    expect(duplicateResponse.status).toBe(409);
  });

  it('logs in with valid credentials and returns a bearer token', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Scheduler User',
      email: 'scheduler@impeasy.test',
      password: 'AnotherPass1!',
    });

    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'scheduler@impeasy.test',
      password: 'AnotherPass1!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        user: expect.objectContaining({
          id: 1,
          name: 'Scheduler User',
          email: 'scheduler@impeasy.test',
          isActive: true,
          roles: [],
        }),
      }),
    );
  });

  it('rejects invalid login credentials', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Ops User',
      email: 'ops@impeasy.test',
      password: 'ValidPass1!',
    });

    const invalidPasswordResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'ops@impeasy.test',
      password: 'WrongPass1!',
    });

    expect(invalidPasswordResponse.status).toBe(401);

    const missingUserResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'missing@impeasy.test',
      password: 'ValidPass1!',
    });

    expect(missingUserResponse.status).toBe(401);
  });

  it('requires a token for /auth/me and returns the authenticated profile when provided', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Quality User',
      email: 'quality@impeasy.test',
      password: 'QualityPass1!',
    });

    const unauthorizedResponse = await request(app.getHttpServer()).get('/auth/me');
    expect(unauthorizedResponse.status).toBe(401);

    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'quality@impeasy.test',
      password: 'QualityPass1!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toEqual(expect.any(String));

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual(
      expect.objectContaining({
        id: 1,
        name: 'Quality User',
        email: 'quality@impeasy.test',
        isActive: true,
        roles: [],
      }),
    );
  });

  it('creates and lists roles, assigns roles to a user, and exposes them via login/me/users', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Admin User',
      email: 'admin@impeasy.test',
      password: 'AdminPass1!',
    });

    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@impeasy.test',
      password: 'AdminPass1!',
    });

    const accessToken = loginResponse.body.accessToken as string;
    expect(accessToken).toEqual(expect.any(String));

    const initialRolesResponse = await request(app.getHttpServer())
      .get('/auth/roles')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(initialRolesResponse.status).toBe(200);
    expect(initialRolesResponse.body).toEqual([]);

    const adminRoleResponse = await request(app.getHttpServer())
      .post('/auth/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'admin' });
    expect(adminRoleResponse.status).toBe(201);
    expect(adminRoleResponse.body).toEqual(
      expect.objectContaining({
        id: 1,
        name: 'admin',
      }),
    );

    const duplicateRoleResponse = await request(app.getHttpServer())
      .post('/auth/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'admin' });
    expect(duplicateRoleResponse.status).toBe(409);

    const plannerRoleResponse = await request(app.getHttpServer())
      .post('/auth/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'planner' });
    expect(plannerRoleResponse.status).toBe(201);

    const listedRolesResponse = await request(app.getHttpServer())
      .get('/auth/roles')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(listedRolesResponse.status).toBe(200);
    expect(listedRolesResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: 'admin' }),
        expect.objectContaining({ id: 2, name: 'planner' }),
      ]),
    );

    const assignResponse = await request(app.getHttpServer())
      .put('/auth/users/1/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        roleIds: [2, 1],
      });

    expect(assignResponse.status).toBe(200);
    expect(assignResponse.body).toEqual(
      expect.objectContaining({
        id: 1,
        email: 'admin@impeasy.test',
        roles: ['admin', 'planner'],
      }),
    );

    const usersResponse = await request(app.getHttpServer())
      .get('/auth/users')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(usersResponse.status).toBe(200);
    expect(usersResponse.body).toEqual([
      expect.objectContaining({
        id: 1,
        email: 'admin@impeasy.test',
        roles: ['admin', 'planner'],
      }),
    ]);

    const reloginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@impeasy.test',
      password: 'AdminPass1!',
    });
    expect(reloginResponse.status).toBe(200);
    expect(reloginResponse.body.user.roles).toEqual(['admin', 'planner']);

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.roles).toEqual(['admin', 'planner']);
  });

  it('rejects unauthenticated and invalid role assignment operations', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      name: 'Planner User',
      email: 'planner-role@impeasy.test',
      password: 'PlannerPass1!',
    });

    const unauthenticatedRolesResponse = await request(app.getHttpServer()).get('/auth/roles');
    expect(unauthenticatedRolesResponse.status).toBe(401);

    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'planner-role@impeasy.test',
      password: 'PlannerPass1!',
    });
    const accessToken = loginResponse.body.accessToken as string;

    const roleResponse = await request(app.getHttpServer())
      .post('/auth/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'operator' });
    expect(roleResponse.status).toBe(201);

    const missingUserResponse = await request(app.getHttpServer())
      .put('/auth/users/999/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ roleIds: [1] });
    expect(missingUserResponse.status).toBe(404);

    const missingRoleResponse = await request(app.getHttpServer())
      .put('/auth/users/1/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ roleIds: [99] });
    expect(missingRoleResponse.status).toBe(400);
  });
});
