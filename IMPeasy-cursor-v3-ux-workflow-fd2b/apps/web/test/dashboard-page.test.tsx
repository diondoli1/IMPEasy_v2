import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import DashboardPage from '../app/dashboard/page';
import { AuthContextProvider } from '../lib/auth-context';
import { impeasyTheme } from '../lib/theme';

function renderDashboard(user: { id: number; name: string; email: string; isActive: boolean; roles: string[]; createdAt: string; updatedAt: string }) {
  return render(
    <ThemeProvider theme={impeasyTheme}>
      <AuthContextProvider value={{ user }}>
        <DashboardPage />
      </AuthContextProvider>
    </ThemeProvider>,
  );
}

describe('DashboardPage', () => {
  it('renders dashboard boxes for admin', () => {
    const user = {
      id: 1,
      name: 'Admin User',
      email: 'admin@impeasy.local',
      isActive: true,
      roles: ['admin'],
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    };

    renderDashboard(user);

    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText('Production Planning')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Procurement')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Kiosk')).toBeInTheDocument();
  });

  it('renders only Kiosk for operator', () => {
    const user = {
      id: 2,
      name: 'Operator User',
      email: 'operator@impeasy.local',
      isActive: true,
      roles: ['operator'],
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    };

    renderDashboard(user);

    expect(screen.getByText('Kiosk')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('CRM')).not.toBeInTheDocument();
  });
});
