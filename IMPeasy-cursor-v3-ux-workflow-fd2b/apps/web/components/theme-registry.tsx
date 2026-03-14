'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { impeasyTheme } from '../lib/theme';

type ThemeRegistryProps = {
  children: ReactNode;
};

export function ThemeRegistry({ children }: ThemeRegistryProps): JSX.Element {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={impeasyTheme}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
}
