import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import type { AuthRoleResponseDto } from './dto/auth-role-response.dto';
import type { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import type { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ReplaceUserRolesDto } from './dto/replace-user-roles.dto';
import { AuthGuard } from './guards/auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() payload: RegisterUserDto): Promise<AuthUserResponseDto> {
    return this.authService.register(payload);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() payload: LoginUserDto): Promise<AuthTokenResponseDto> {
    return this.authService.login(payload);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest): Promise<AuthUserResponseDto> {
    return this.authService.getCurrentUser(request.authTokenPayload);
  }

  @UseGuards(AuthGuard)
  @Get('users')
  @Roles('admin')
  listUsers(): Promise<AuthUserResponseDto[]> {
    return this.authService.listUsers();
  }

  @UseGuards(AuthGuard)
  @Get('roles')
  @Roles('admin')
  listRoles(): Promise<AuthRoleResponseDto[]> {
    return this.authService.listRoles();
  }

  @UseGuards(AuthGuard)
  @Post('roles')
  @Roles('admin')
  createRole(@Body() payload: CreateRoleDto): Promise<AuthRoleResponseDto> {
    return this.authService.createRole(payload);
  }

  @UseGuards(AuthGuard)
  @Put('users/:userId/roles')
  @Roles('admin')
  replaceUserRoles(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() payload: ReplaceUserRolesDto,
  ): Promise<AuthUserResponseDto> {
    return this.authService.replaceUserRoles(userId, payload);
  }
}
