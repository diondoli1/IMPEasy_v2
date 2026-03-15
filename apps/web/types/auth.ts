export type AuthUser = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

export type AuthRole = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginUserInput = {
  email: string;
  password: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  user: AuthUser;
};

export type CreateRoleInput = {
  name: string;
  description?: string;
};

export type ReplaceUserRolesInput = {
  roleIds: number[];
};
