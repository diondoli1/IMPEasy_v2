import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY, type FixedRole } from '../auth.constants';

export const Roles = (...roles: FixedRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
