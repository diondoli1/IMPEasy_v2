import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import LoginPage from '../app/login/page';
import { loginUser } from '../lib/api';
import { setAuthToken } from '../lib/auth-storage';

const routerReplaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}));

vi.mock('../lib/api', () => ({
  loginUser: vi.fn(),
}));

vi.mock('../lib/auth-storage', () => ({
  setAuthToken: vi.fn(),
}));

const loginUserMock = vi.mocked(loginUser);
const setAuthTokenMock = vi.mocked(setAuthToken);

describe('LoginPage', () => {
  beforeEach(() => {
    routerReplaceMock.mockReset();
    loginUserMock.mockReset();
    setAuthTokenMock.mockReset();
  });

  it('validates required credentials for sign-in', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required.');
    });
  });

  it('stores token and redirects to the role landing when sign-in succeeds', async () => {
    loginUserMock.mockResolvedValue({
      accessToken: 'auth-token-value',
      user: {
        id: 7,
        name: 'Planner User',
        email: 'planner@impeasy.local',
        isActive: true,
        roles: ['planner'],
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'planner@impeasy.local' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPass1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(loginUserMock).toHaveBeenCalledWith({
        email: 'planner@impeasy.local',
        password: 'StrongPass1!',
      });
    });

    expect(setAuthTokenMock).toHaveBeenCalledWith('auth-token-value');
    expect(routerReplaceMock).toHaveBeenCalledWith('/manufacturing-orders');
  });

  it('shows an error when sign-in fails', async () => {
    loginUserMock.mockRejectedValue(new Error('Unauthorized'));

    render(<LoginPage />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'planner@impeasy.local' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'WrongPass1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
    });
  });
});
