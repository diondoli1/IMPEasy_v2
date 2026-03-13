import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Role, User } from '@prisma/client';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import type { AuthRoleResponseDto } from './dto/auth-role-response.dto';
import type { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import type { AuthUserResponseDto } from './dto/auth-user-response.dto';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { LoginUserDto } from './dto/login-user.dto';
import type { RegisterUserDto } from './dto/register-user.dto';
import type { ReplaceUserRolesDto } from './dto/replace-user-roles.dto';
import { AuthTokenService } from './auth-token.service';
import { FIXED_ROLES } from './auth.constants';
import type { AuthTokenPayload } from './interfaces/auth-token-payload.interface';

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_DERIVED_KEY_BYTES = 64;
const USER_WITH_ROLE_NAMES_INCLUDE = {
  userRoles: {
    include: {
      role: {
        select: {
          name: true,
        },
      },
    },
  },
} as const;

type UserWithRoleNames = User & {
  userRoles: Array<{
    role: {
      name: string;
    };
  }>;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async register(payload: RegisterUserDto): Promise<AuthUserResponseDto> {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const normalizedName = this.normalizeName(payload.name);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const user = await this.prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash: this.hashPassword(payload.password),
        isActive: true,
      },
    });

    return this.toAuthUserResponse(user);
  }

  async login(payload: LoginUserDto): Promise<AuthTokenResponseDto> {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: USER_WITH_ROLE_NAMES_INCLUDE,
    });

    if (!user || !this.verifyPassword(payload.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive.');
    }

    return {
      accessToken: this.authTokenService.sign({ sub: user.id, email: user.email }),
      user: this.toAuthUserResponse(user),
    };
  }

  async getCurrentUser(authTokenPayload: AuthTokenPayload): Promise<AuthUserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: authTokenPayload.sub },
      include: USER_WITH_ROLE_NAMES_INCLUDE,
    });

    if (!user || user.email !== authTokenPayload.email) {
      throw new UnauthorizedException('Invalid auth token identity.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive.');
    }

    return this.toAuthUserResponse(user);
  }

  async listUsers(): Promise<AuthUserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      include: USER_WITH_ROLE_NAMES_INCLUDE,
    });

    return users.map((user) => this.toAuthUserResponse(user));
  }

  async listRoles(): Promise<AuthRoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        name: {
          in: [...FIXED_ROLES],
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => this.toAuthRoleResponse(role));
  }

  async createRole(payload: CreateRoleDto): Promise<AuthRoleResponseDto> {
    const normalizedRoleName = this.normalizeRoleName(payload.name);
    if (!FIXED_ROLES.includes(normalizedRoleName as (typeof FIXED_ROLES)[number])) {
      throw new BadRequestException(
        `Only fixed MVP roles are allowed: ${FIXED_ROLES.join(', ')}.`,
      );
    }

    const normalizedDescription = this.normalizeDescription(payload.description);
    const existingRole = await this.prisma.role.findUnique({
      where: { name: normalizedRoleName },
    });

    if (existingRole) {
      throw new ConflictException('Role name already exists.');
    }

    const role = await this.prisma.role.create({
      data: {
        name: normalizedRoleName,
        description: normalizedDescription,
      },
    });

    return this.toAuthRoleResponse(role);
  }

  async replaceUserRoles(userId: number, payload: ReplaceUserRolesDto): Promise<AuthUserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const roleIds = [...payload.roleIds];
    if (roleIds.length > 0) {
      const existingRoles = await this.prisma.role.findMany({
        where: {
          id: {
            in: roleIds,
          },
        },
      });

      if (existingRoles.length !== roleIds.length) {
        throw new BadRequestException('One or more roles do not exist.');
      }

      const hasUnsupportedRoles = existingRoles.some(
        (role) => !FIXED_ROLES.includes(role.name as (typeof FIXED_ROLES)[number]),
      );
      if (hasUnsupportedRoles) {
        throw new BadRequestException(
          `Only fixed MVP roles are assignable: ${FIXED_ROLES.join(', ')}.`,
        );
      }
    }

    await this.prisma.$transaction(async (transactionalPrisma) => {
      await transactionalPrisma.userRole.deleteMany({
        where: { userId },
      });

      if (roleIds.length === 0) {
        return;
      }

      await transactionalPrisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      });
    });

    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_WITH_ROLE_NAMES_INCLUDE,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found.');
    }

    return this.toAuthUserResponse(updatedUser);
  }

  private toAuthUserResponse(user: User | UserWithRoleNames): AuthUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      roles: this.extractRoleNames(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toAuthRoleResponse(role: Role): AuthRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  private extractRoleNames(user: User | UserWithRoleNames): string[] {
    if (!('userRoles' in user) || !Array.isArray(user.userRoles)) {
      return [];
    }

    return user.userRoles.map((userRole) => userRole.role.name).sort((left, right) => {
      return left.localeCompare(right);
    });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeName(name: string): string {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new BadRequestException('Name is required.');
    }

    return normalizedName;
  }

  private normalizeRoleName(roleName: string): string {
    const normalizedRoleName = roleName.trim().toLowerCase();

    if (!normalizedRoleName) {
      throw new BadRequestException('Role name is required.');
    }

    return normalizedRoleName;
  }

  private normalizeDescription(description: string | undefined): string | null {
    if (description === undefined) {
      return null;
    }

    const normalizedDescription = description.trim();
    return normalizedDescription.length > 0 ? normalizedDescription : null;
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
    const derivedKey = scryptSync(password, salt, PASSWORD_DERIVED_KEY_BYTES).toString('hex');

    return `${salt}:${derivedKey}`;
  }

  private verifyPassword(password: string, passwordHash: string): boolean {
    const [salt, storedDerivedKey] = passwordHash.split(':');

    if (!salt || !storedDerivedKey) {
      return false;
    }

    const providedDerivedKey = scryptSync(password, salt, PASSWORD_DERIVED_KEY_BYTES).toString(
      'hex',
    );
    const providedBuffer = Buffer.from(providedDerivedKey, 'hex');
    const storedBuffer = Buffer.from(storedDerivedKey, 'hex');

    if (providedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, storedBuffer);
  }
}
