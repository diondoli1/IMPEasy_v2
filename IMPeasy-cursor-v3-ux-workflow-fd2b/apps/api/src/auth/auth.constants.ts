export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export const FIXED_ROLES = ['admin', 'office', 'planner', 'operator'] as const;

export type FixedRole = (typeof FIXED_ROLES)[number];
