import type { Request } from 'express';

import type { AuthTokenPayload } from './auth-token-payload.interface';

export type AuthenticatedRequest = Request & {
  authTokenPayload: AuthTokenPayload;
};
