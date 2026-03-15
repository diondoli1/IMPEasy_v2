import { AuthUserResponseDto } from './auth-user-response.dto';

export class AuthTokenResponseDto {
  accessToken!: string;
  user!: AuthUserResponseDto;
}
