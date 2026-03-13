export const FIXED_ROLE_ORDER = ['admin', 'office', 'planner', 'operator'] as const;

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
  admin: 'Maintains users, settings, numbering, and module dashboards.',
  office: 'Owns commercial, purchasing, shipping, invoicing, and stock visibility.',
  planner: 'Owns manufactured items, routings, manufacturing orders, and assignments.',
  operator: 'Works only from the fixed kiosk queue and execution screen.',
};

export const LANDING_PATH_BY_ROLE: Record<RoleName, string> = {
  admin: '/dashboards/customer-orders',
  office: '/customer-orders',
  planner: '/manufacturing-orders',
  operator: '/kiosk',
};

function matchesRoutePrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    key: 'customer-orders',
    href: '/customer-orders',
    label: 'Customer Orders',
    roles: ['admin', 'office'],
    tabs: [
      {
        href: '/customer-orders',
        label: 'Board',
        roles: ['admin', 'office'],
      },
      {
        href: '/customers',
        label: 'Customers',
        roles: ['admin', 'office'],
      },
      {
        href: '/dashboards/customer-orders',
        label: 'Dashboard',
        roles: ['admin', 'office'],
      },
    ],
    matches: (pathname: string) =>
      matchesRoutePrefix(pathname, [
        '/customer-orders',
        '/dashboards/customer-orders',
        '/customers',
        '/quotes',
        '/sales-orders',
        '/sales',
      ]),
  },
  {
    key: 'production',
    href: '/manufacturing-orders',
    label: 'Production',
    roles: ['admin', 'planner', 'operator'],
    tabs: [
      {
        href: '/manufactured-items',
        label: 'Manufactured Items',
        roles: ['admin', 'planner'],
      },
      {
        href: '/manufacturing-orders',
        label: 'Manufacturing Orders',
        roles: ['admin', 'planner'],
      },
      {
        href: '/production/calendar',
        label: 'Calendar',
        roles: ['admin', 'planner'],
      },
      {
        href: '/dashboards/production',
        label: 'Dashboard',
        roles: ['admin', 'planner'],
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
      ]),
  },
  {
    key: 'inventory',
    href: '/stock/items',
    label: 'Inventory',
    roles: ['admin', 'office', 'planner'],
    tabs: [
      {
        href: '/stock/items',
        label: 'Stock Items',
        roles: ['admin', 'office', 'planner'],
      },
      {
        href: '/stock/lots',
        label: 'Lots',
        roles: ['admin', 'office', 'planner'],
      },
      {
        href: '/stock/movements',
        label: 'Movements',
        roles: ['admin', 'office', 'planner'],
      },
      {
        href: '/stock/critical-on-hand',
        label: 'Critical',
        roles: ['admin', 'office', 'planner'],
      },
      {
        href: '/dashboards/inventory',
        label: 'Dashboard',
        roles: ['admin', 'office', 'planner'],
      },
    ],
    matches: (pathname: string) =>
      matchesRoutePrefix(pathname, ['/dashboards/inventory', '/inventory', '/stock']),
  },
  {
    key: 'purchasing',
    href: '/purchase-orders',
    label: 'Purchasing',
    roles: ['admin', 'office'],
    tabs: [
      {
        href: '/purchase-orders',
        label: 'Purchase Orders',
        roles: ['admin', 'office'],
      },
      {
        href: '/suppliers',
        label: 'Vendors',
        roles: ['admin', 'office'],
      },
      {
        href: '/invoices',
        label: 'Invoices',
        roles: ['admin', 'office'],
      },
      {
        href: '/dashboards/purchasing',
        label: 'Dashboard',
        roles: ['admin', 'office'],
      },
    ],
    matches: (pathname: string) =>
      matchesRoutePrefix(pathname, [
        '/dashboards/purchasing',
        '/purchase-orders',
        '/suppliers',
        '/shipments',
        '/invoices',
      ]),
  },
  {
    key: 'settings',
    href: '/settings/company',
    label: 'Settings',
    roles: ['admin'],
    tabs: [
      {
        href: '/roles',
        label: 'Roles',
        roles: ['admin'],
      },
      {
        href: '/settings/company',
        label: 'Company',
        roles: ['admin'],
      },
      {
        href: '/settings/numbering',
        label: 'Numbering',
        roles: ['admin'],
      },
      {
        href: '/settings/payment-terms',
        label: 'Payment Terms',
        roles: ['admin'],
      },
      {
        href: '/settings/shipping-terms',
        label: 'Shipping Terms',
        roles: ['admin'],
      },
      {
        href: '/settings/shipping-methods',
        label: 'Shipping Methods',
        roles: ['admin'],
      },
      {
        href: '/settings/tax-rates',
        label: 'Tax Rates',
        roles: ['admin'],
      },
      {
        href: '/settings/document-templates',
        label: 'Templates',
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
    prefixes: ['/items', '/boms', '/routings', '/work-orders', '/operations', '/production'],
    roles: ['admin', 'planner'],
  },
  {
    prefixes: ['/inventory'],
    roles: ['admin', 'office', 'planner'],
  },
];

function resolveExplicitPathRoles(pathname: string): RoleName[] | null {
  const matchedRule = EXPLICIT_PATH_ACCESS_RULES.find((rule) =>
    matchesRoutePrefix(pathname, rule.prefixes),
  );

  return matchedRule ? matchedRule.roles : null;
}

export function normalizeRoles(roles: string[]): RoleName[] {
  const normalizedRoles = roles
    .map((role) => role.trim().toLowerCase())
    .filter((role): role is RoleName => FIXED_ROLE_ORDER.includes(role as RoleName));

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

  const explicitRoles = resolveExplicitPathRoles(pathname);
  if (explicitRoles) {
    return explicitRoles.some((role) => normalizedRoles.includes(role));
  }

  const matchedGroup = getActiveNavigationGroup(pathname);
  if (!matchedGroup) {
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
