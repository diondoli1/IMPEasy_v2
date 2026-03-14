'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import React from 'react';

import { useAuth } from '../../lib/auth-context';
import { normalizeRoles } from '../../lib/navigation';

type DashboardBox = {
  label: string;
  href: string;
  roles: string[];
};

const DASHBOARD_BOXES: DashboardBox[] = [
  { label: 'CRM', href: '/crm', roles: ['admin', 'office'] },
  { label: 'Production Planning', href: '/manufacturing-orders', roles: ['admin', 'planner'] },
  { label: 'Stock', href: '/stock/items', roles: ['admin', 'office', 'planner'] },
  { label: 'Procurement', href: '/purchase-orders', roles: ['admin', 'office'] },
  { label: 'Settings', href: '/settings/company', roles: ['admin'] },
  { label: 'Kiosk', href: '/kiosk', roles: ['admin', 'operator'] },
];

export default function DashboardPage(): JSX.Element {
  const { user: currentUser } = useAuth();
  if (!currentUser) return <Box />;
  const normalizedRoles = normalizeRoles(currentUser.roles);
  const visibleBoxes = DASHBOARD_BOXES.filter((box) =>
    box.roles.some((role) => normalizedRoles.includes(role as 'admin' | 'office' | 'planner' | 'operator')),
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
      {visibleBoxes.map((box) => (
        <Card key={box.href} sx={{ height: '100%' }}>
          <CardActionArea component={Link} href={box.href} sx={{ height: '100%' }}>
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="h6" component="span">
                {box.label}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
