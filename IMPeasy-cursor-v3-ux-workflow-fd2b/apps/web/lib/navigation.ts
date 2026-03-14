/** UX spec: Admin and Operator only. office/planner mapped to admin for backward compatibility. */
export const FIXED_ROLE_ORDER = ['admin', 'operator'] as const;

export type RoleName = (typeof FIXED_ROLE_ORDER)[number];

export type NavigationGroupKey =
  | 'customer-orders'
  | 'production'
  | 'inventory'
  | 'purchasing'
  | 'settings';

export type NavigationTab = {
  href: string;
  label: string;
  roles: RoleName[];
};

export type NavigationGroup = {
  key: NavigationGroupKey;
  href: string;
  label: string;
  roles: RoleName[];
  tabs: NavigationTab[];
  matches: (pathname: string) => boolean;
};

export const FIXED_ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  admin: 'Full access: CRM, Production, Stock, Procurement, Settings.',
  operator: 'Works only from the fixed kiosk queue and execution screen.',
};

export const LANDING_PATH_BY_ROLE: Record<RoleName, string> = {
  admin: '/dashboard',
  operator: '/kiosk',
};

function matchesRoutePrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    key: 'customer-orders',
    href: '/customer-orders',
    label: 'CRM',
    roles: ['admin'],
    tabs: [
      {
        href: '/customer-orders',
        label: 'Customer Orders',
        roles: ['admin'],
      },
      {
        href: '/customers',
        label: 'Customers',
        roles: ['admin'],
      },
      {
        href: '/invoices',
        label: 'Invoices',
        roles: ['admin'],
      },
      {
        href: '/sales-management',
        label: 'Sales Management',
        roles: ['admin'],
      },
    ],
    matches: (pathname: string) =>
      matchesRoutePrefix(pathname, [
        '/crm',
        '/customer-orders',
        '/dashboards/customer-orders',
        '/customers',
        '/quotes',
        '/sales-orders',
        '/sales',
        '/invoices',
        '/sales-management',
      ]),
  },
  {
    key: 'production',
    href: '/manufacturing-orders',
    label: 'Production Planning',
    roles: ['admin', 'operator'],
    tabs: [
      {
        href: '/manufacturing-orders',
        label: 'Manufacturing Orders',
        roles: ['admin'],
      },
      {
        href: '/workstations',
        label: 'Workstations',
        roles: ['admin'],
      },
      {
        href: '/workstation-groups',
        label: 'Workstation Group',
        roles: ['admin'],
      },
      {
        href: '/boms',
        label: 'BOM',
        roles: ['admin'],
      },
      {
        href: '/routings',
        label: 'Routings',
        roles: ['admin'],
      },
      {
        href: '/kiosk',
        label: 'Kiosk',
        roles: ['admin', 'operator'],
      },
    ],
    matches: (pathname: string) =>
      matchesRoutePrefix(pathname, [
        '/manufacturing-orders',
        '/manufactured-items',
        '/production/calendar',
        '/dashboards/production',
        '/kiosk',
        '/items',
        '/boms',
        '/routings',
        '/work-orders',
        '/operations',
        '/production',
        '/workstations',
        '/workstation-groups',
      ]),
  },
  {
    key: 'inventory',
    href: '/stock/items',
    label: 'Stock',
    roles: ['admin'],
    tabs: [
      {
        href: '/stock/items',
        label: 'Items',
        roles: ['admin'],
      },
      {
        href: '/stock/settings',
        label: 'Stock settings',
        roles: ['admin'],
      },
      {
        href: '/stock/shipments',
        label: 'Shipments',
        roles: ['admin'],
      },
      {
        href: '/stock/inventory',
        label: 'Inventory',
        roles: ['admin'],
      },
    ],
    matches: (pathname: string) =>
      matchesRoutePrefix(pathname, [
        '/dashboards/inventory',
        '/inventory',
        '/stock',
        '/stock/settings',
        '/stock/shipments',
        '/stock/inventory',
      ]),
  },
  {
    key: 'purchasing',
    href: '/purchase-orders',
    label: 'Procurement',
    roles: ['admin'],
    tabs: [
      {
        href: '/purchase-orders',
        label: 'Purchase Orders',
        roles: ['admin'],
      },
      {
        href: '/suppliers',
        label: 'Vendors',
        roles: ['admin'],
      },
      {
        href: '/procurement/invoices',
        label: 'Invoices',
        roles: ['admin'],
      },
    ],
    matches: (pathname: string) =>
      matchesRoutePrefix(pathname, [
        '/dashboards/purchasing',
        '/purchase-orders',
        '/suppliers',
        '/procurement',
      ]),
  },
  {
    key: 'settings',
    href: '/settings/company',
    label: 'Settings',
    roles: ['admin'],
    tabs: [
      {
        href: '/settings/company',
        label: 'Company details',
        roles: ['admin'],
      },
      {
        href: '/settings/numbering',
        label: 'Numbering formats',
        roles: ['admin'],
      },
      {
        href: '/roles',
        label: 'User roles',
        roles: ['admin'],
      },
    ],
    matches: (pathname: string) =>
      matchesRoutePrefix(pathname, ['/settings', '/roles']),
  },
];

const EXPLICIT_PATH_ACCESS_RULES: Array<{
  prefixes: string[];
  roles: RoleName[];
}> = [
  {
    prefixes: ['/items', '/boms', '/routings', '/work-orders', '/operations', '/production', '/workstations', '/workstation-groups'],
    roles: ['admin'],
  },
  {
    prefixes: ['/inventory'],
    roles: ['admin'],
  },
];

function resolveExplicitPathRoles(pathname: string): RoleName[] | null {
  const matchedRule = EXPLICIT_PATH_ACCESS_RULES.find((rule) =>
    matchesRoutePrefix(pathname, rule.prefixes),
  );

  return matchedRule ? matchedRule.roles : null;
}

/** Maps office/planner to admin for backward compatibility. */
export function normalizeRoles(roles: string[]): RoleName[] {
  const mapped = roles.map((role) => {
    const r = role.trim().toLowerCase();
    if (r === 'office' || r === 'planner') return 'admin';
    return r;
  });
  const normalizedRoles = mapped.filter((role): role is RoleName =>
    FIXED_ROLE_ORDER.includes(role as RoleName),
  );
  return Array.from(new Set(normalizedRoles)).sort((left, right) => {
    return FIXED_ROLE_ORDER.indexOf(left) - FIXED_ROLE_ORDER.indexOf(right);
  });
}

export function getPrimaryRole(roles: string[]): RoleName | null {
  const normalizedRoles = normalizeRoles(roles);
  return normalizedRoles[0] ?? null;
}

export function getLandingPath(roles: string[]): string {
  const primaryRole = getPrimaryRole(roles);
  return primaryRole ? LANDING_PATH_BY_ROLE[primaryRole] : '/login';
}

export function getVisibleNavigationGroups(roles: string[]): NavigationGroup[] {
  const normalizedRoles = normalizeRoles(roles);

  return NAVIGATION_GROUPS.filter((group) => {
    return group.roles.some((role) => normalizedRoles.includes(role));
  });
}

export function getActiveNavigationGroup(pathname: string): NavigationGroup | null {
  return NAVIGATION_GROUPS.find((group) => group.matches(pathname)) ?? null;
}

export function getVisibleNavigationTabs(pathname: string, roles: string[]): NavigationTab[] {
  const activeGroup = getActiveNavigationGroup(pathname);
  if (!activeGroup) {
    return [];
  }

  const normalizedRoles = normalizeRoles(roles);

  return activeGroup.tabs.filter((tab) => {
    return tab.roles.some((role) => normalizedRoles.includes(role));
  });
}

export function canAccessPath(pathname: string, roles: string[]): boolean {
  const normalizedRoles = normalizeRoles(roles);
  if (normalizedRoles.includes('admin')) {
    return true;
  }

  if (normalizedRoles.includes('operator') && !normalizedRoles.includes('admin')) {
    return pathname === '/kiosk' || pathname.startsWith('/kiosk/');
  }

  const explicitRoles = resolveExplicitPathRoles(pathname);
  if (explicitRoles) {
    return explicitRoles.some((role) => normalizedRoles.includes(role));
  }

  const matchedGroup = getActiveNavigationGroup(pathname);
  if (!matchedGroup) {
    if (pathname === '/dashboard') {
      return normalizedRoles.includes('admin');
    }
    return pathname === '/' || pathname === '/login';
  }

  const matchedTab = matchedGroup.tabs.find((tab) => {
    return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  });

  if (matchedTab) {
    return matchedTab.roles.some((role) => normalizedRoles.includes(role));
  }

  return matchedGroup.roles.some((role) => normalizedRoles.includes(role));
}
