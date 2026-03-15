'use client';

import GroupIcon from '@mui/icons-material/Group';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SettingsIcon from '@mui/icons-material/Settings';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import React from 'react';

import { useAuth } from '../../lib/auth-context';
import { normalizeRoles, type RoleName } from '../../lib/navigation';

type DashboardBox = {
  label: string;
  href: string;
  roles: RoleName[];
  Icon: React.ComponentType<{ sx?: object }>;
};

const DASHBOARD_BOXES: DashboardBox[] = [
  { label: 'CRM', href: '/customer-orders', roles: ['admin'], Icon: GroupIcon },
  { label: 'Production Planning', href: '/manufacturing-orders', roles: ['admin'], Icon: PrecisionManufacturingIcon },
  { label: 'Stock', href: '/stock/items', roles: ['admin'], Icon: Inventory2Icon },
  { label: 'Procurement', href: '/purchase-orders', roles: ['admin'], Icon: ShoppingCartIcon },
  { label: 'Settings', href: '/settings/company', roles: ['admin'], Icon: SettingsIcon },
  { label: 'Kiosk', href: '/kiosk', roles: ['admin', 'operator'], Icon: TouchAppIcon },
];

export default function DashboardPage(): JSX.Element {
  const { user: currentUser } = useAuth();
  if (!currentUser) return <Box />;
  const normalizedRoles = normalizeRoles(currentUser.roles);
  const visibleBoxes = DASHBOARD_BOXES.filter((box) =>
    box.roles.some((role: RoleName) => normalizedRoles.includes(role)),
  );

  return (
    <Box
      sx={{
        p: 3,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 3,
      }}
    >
      {visibleBoxes.map((box) => {
        const Icon = box.Icon;
        return (
          <Card key={box.href} sx={{ height: '100%' }}>
            <CardActionArea component={Link} href={box.href} sx={{ height: '100%' }}>
              <CardContent sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Icon sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="h6" component="span">
                  {box.label}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}
