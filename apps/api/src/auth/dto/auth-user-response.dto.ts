export class AuthUserResponseDto {
  id!: number;
  name!: string;
  email!: string;
  isActive!: boolean;
  roles!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}
