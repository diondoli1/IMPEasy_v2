'use client';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

const SIDEBAR_ITEMS = [
  { href: '/settings/company', label: 'Company details' },
  { href: '/settings/numbering', label: 'Numbering formats' },
  { href: '/roles', label: 'User roles' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', minHeight: 0, flex: 1 }}>
      <Box
        component="nav"
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <List dense disablePadding sx={{ py: 1 }}>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{ mx: 1, borderRadius: 1 }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto' }}>{children}</Box>
    </Box>
  );
}
