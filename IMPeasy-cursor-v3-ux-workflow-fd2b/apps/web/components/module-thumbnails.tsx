'use client';

import GroupIcon from '@mui/icons-material/Group';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SettingsIcon from '@mui/icons-material/Settings';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import Box from '@mui/material/Box';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { normalizeRoles, type RoleName } from '../lib/navigation';

type ModuleThumb = {
  label: string;
  href: string;
  roles: RoleName[];
  Icon: React.ComponentType<{ sx?: object }>;
};

const MODULE_THUMBS: ModuleThumb[] = [
  { label: 'CRM', href: '/crm', roles: ['admin'], Icon: GroupIcon },
  { label: 'Production', href: '/manufacturing-orders', roles: ['admin'], Icon: PrecisionManufacturingIcon },
  { label: 'Stock', href: '/stock/items', roles: ['admin'], Icon: Inventory2Icon },
  { label: 'Procurement', href: '/purchase-orders', roles: ['admin'], Icon: ShoppingCartIcon },
  { label: 'Settings', href: '/settings/company', roles: ['admin'], Icon: SettingsIcon },
  { label: 'Kiosk', href: '/kiosk', roles: ['admin', 'operator'], Icon: TouchAppIcon },
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
      pathname.startsWith('/dashboards/purchasing') || pathname.startsWith('/procurement');
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
    t.roles.some((r: RoleName) => normalizedRoles.includes(r)),
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
        const Icon = thumb.Icon;
        return (
          <Link
            key={thumb.href}
            href={thumb.href}
            style={{ textDecoration: 'none' }}
          >
            <Box
              sx={{
                width: 88,
                height: 88,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: active ? 'primary.main' : 'action.hover',
                color: active ? 'primary.contrastText' : 'text.primary',
                fontWeight: 600,
                fontSize: '0.75rem',
                textAlign: 'center',
                boxShadow: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: active ? 'primary.dark' : 'action.selected',
                  boxShadow: 2,
                },
              }}
            >
              <Icon sx={{ fontSize: 28, mb: 0.5 }} />
              {thumb.label}
            </Box>
          </Link>
        );
      })}
    </Box>
  );
}
