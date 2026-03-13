import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { AppShell } from '../components/app-shell';
import { getCurrentUser } from '../lib/api';
import { clearAuthToken, getAuthToken } from '../lib/auth-storage';

const routerReplaceMock = vi.fn();
const usePathnameMock = vi.fn<string, []>();
const routerMock = {
  replace: routerReplaceMock,
};

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => routerMock,
}));

vi.mock('../lib/auth-storage', () => ({
  clearAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  getCurrentUser: vi.fn(),
}));

const getAuthTokenMock = vi.mocked(getAuthToken);
const clearAuthTokenMock = vi.mocked(clearAuthToken);
const getCurrentUserMock = vi.mocked(getCurrentUser);

describe('AppShell', () => {
  beforeEach(() => {
    routerReplaceMock.mockReset();
    usePathnameMock.mockReset();
    getAuthTokenMock.mockReset();
    clearAuthTokenMock.mockReset();
    getCurrentUserMock.mockReset();
  });

  it('redirects to /login when no token exists for a protected route', async () => {
    usePathnameMock.mockReturnValue('/customer-orders');
    getAuthTokenMock.mockReturnValue(null);

    render(
      <AppShell>
        <p>Protected content</p>
      </AppShell>,
    );

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledWith('/login');
    });

    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders role-aware navigation and supports logout', async () => {
    usePathnameMock.mockReturnValue('/manufacturing-orders');
    getAuthTokenMock.mockReturnValue('existing-token');
    getCurrentUserMock.mockResolvedValue({
      id: 4,
      name: 'Planner User',
      email: 'planner@impeasy.local',
      isActive: true,
      roles: ['planner'],
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    });

    render(
      <AppShell>
        <p>Protected content</p>
      </AppShell>,
    );

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    expect(screen.getByText('planner@impeasy.local')).toBeInTheDocument();
    expect(screen.getByText('planner')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.getByText('Manufacturing Orders')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(clearAuthTokenMock).toHaveBeenCalledTimes(1);
    expect(routerReplaceMock).toHaveBeenCalledWith('/login');
  });

  it('redirects authenticated users away from /login to their role landing page', async () => {
    usePathnameMock.mockReturnValue('/login');
    getAuthTokenMock.mockReturnValue('existing-token');
    getCurrentUserMock.mockResolvedValue({
      id: 8,
      name: 'Operator User',
      email: 'operator@impeasy.local',
      isActive: true,
      roles: ['operator'],
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    });

    render(
      <AppShell>
        <p>Login content</p>
      </AppShell>,
    );

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledWith('/kiosk');
    });

    expect(screen.queryByText('Login content')).not.toBeInTheDocument();
  });
});
