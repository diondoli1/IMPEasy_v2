'use client';

import Box from '@mui/material/Box';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { normalizeRoles } from '../lib/navigation';

type ModuleThumb = {
  label: string;
  href: string;
  roles: string[];
};

const MODULE_THUMBS: ModuleThumb[] = [
  { label: 'CRM', href: '/crm', roles: ['admin', 'office'] },
  { label: 'Production', href: '/manufacturing-orders', roles: ['admin', 'planner'] },
  { label: 'Stock', href: '/stock/items', roles: ['admin', 'office', 'planner'] },
  { label: 'Procurement', href: '/purchase-orders', roles: ['admin', 'office'] },
  { label: 'Settings', href: '/settings/company', roles: ['admin'] },
  { label: 'Kiosk', href: '/kiosk', roles: ['admin', 'operator'] },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/crm') {
    return pathname === '/crm' || pathname === '/customer-orders' || pathname.startsWith('/customer-orders/') ||
      pathname === '/customers' || pathname.startsWith('/customers/') ||
      pathname.startsWith('/dashboards/customer-orders') || pathname.startsWith('/quotes') ||
      pathname.startsWith('/sales-orders') || pathname.startsWith('/sales') || pathname.startsWith('/invoices') ||
      pathname === '/sales-management';
  }
  if (href === '/manufacturing-orders') {
    return pathname === '/manufacturing-orders' || pathname.startsWith('/manufacturing-orders/') ||
      pathname.startsWith('/manufactured-items') || pathname.startsWith('/production') ||
      pathname.startsWith('/dashboards/production') || pathname.startsWith('/items') ||
      pathname.startsWith('/boms') || pathname.startsWith('/routings') ||
      pathname.startsWith('/work-orders') || pathname.startsWith('/operations') ||
      pathname.startsWith('/workstations') || pathname.startsWith('/workstation-groups');
  }
  if (href === '/stock/items') {
    return pathname.startsWith('/stock') || pathname.startsWith('/dashboards/inventory') ||
      pathname.startsWith('/inventory');
  }
  if (href === '/purchase-orders') {
    return pathname.startsWith('/purchase-orders') || pathname.startsWith('/suppliers') ||
      pathname.startsWith('/dashboards/purchasing') || pathname.startsWith('/shipments');
  }
  if (href === '/settings/company') {
    return pathname.startsWith('/settings') || pathname === '/roles';
  }
  if (href === '/kiosk') {
    return pathname === '/kiosk' || pathname.startsWith('/kiosk/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type ModuleThumbnailsProps = {
  roles: string[];
};

export function ModuleThumbnails({ roles }: ModuleThumbnailsProps): JSX.Element {
  const pathname = usePathname();
  const normalizedRoles = normalizeRoles(roles);
  const visibleThumbs = MODULE_THUMBS.filter((t) =>
    t.roles.some((r) => normalizedRoles.includes(r as 'admin' | 'office' | 'planner' | 'operator')),
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        py: 2,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {visibleThumbs.map((thumb) => {
        const active = isActive(pathname, thumb.href);
        return (
          <Link
            key={thumb.href}
            href={thumb.href}
            style={{ textDecoration: 'none' }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                bgcolor: active ? 'primary.main' : 'action.hover',
                color: active ? 'primary.contrastText' : 'text.primary',
                fontWeight: 600,
                fontSize: '0.75rem',
                textAlign: 'center',
                px: 2,
                '&:hover': {
                  bgcolor: active ? 'primary.dark' : 'action.selected',
                },
              }}
            >
              {thumb.label}
            </Box>
          </Link>
        );
      })}
    </Box>
  );
}
