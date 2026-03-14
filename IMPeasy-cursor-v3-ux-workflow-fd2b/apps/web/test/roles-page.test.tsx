import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import RolesPage from '../app/roles/page';
import { listAuthRoles, listAuthUsers, replaceAuthUserRoles } from '../lib/api';

vi.mock('../lib/api', () => ({
  listAuthRoles: vi.fn(),
  listAuthUsers: vi.fn(),
  replaceAuthUserRoles: vi.fn(),
}));

const listAuthRolesMock = vi.mocked(listAuthRoles);
const listAuthUsersMock = vi.mocked(listAuthUsers);
const replaceAuthUserRolesMock = vi.mocked(replaceAuthUserRoles);

describe('RolesPage', () => {
  beforeEach(() => {
    listAuthRolesMock.mockReset();
    listAuthUsersMock.mockReset();
    replaceAuthUserRolesMock.mockReset();
  });

  it('loads the fixed role table and users', async () => {
    listAuthRolesMock.mockResolvedValue([
      {
        id: 1,
        name: 'admin',
        description: 'System administrators',
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
      {
        id: 2,
        name: 'office',
        description: 'Office users',
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
      {
        id: 3,
        name: 'planner',
        description: 'Planner users',
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
      {
        id: 4,
        name: 'operator',
        description: 'Operator users',
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ]);
    listAuthUsersMock.mockResolvedValue([
      {
        id: 7,
        name: 'Planner User',
        email: 'planner@impeasy.local',
        isActive: true,
        roles: ['planner'],
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ]);

    render(<RolesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Users and roles' })).toBeInTheDocument();
    });

    expect(screen.getAllByText('/dashboard').length).toBeGreaterThan(0);
    expect(screen.getByText('planner@impeasy.local')).toBeInTheDocument();
    expect(screen.getAllByText('planner').length).toBeGreaterThan(0);
  });

  it('warns when required fixed roles are missing', async () => {
    listAuthRolesMock.mockResolvedValue([
      {
        id: 1,
        name: 'admin',
        description: 'System administrators',
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ]);
    listAuthUsersMock.mockResolvedValue([]);

    render(<RolesPage />);

    await waitFor(() => {
      expect(screen.getByText('Missing fixed roles')).toBeInTheDocument();
    });
  });

  it('replaces selected user roles using the fixed role set', async () => {
    listAuthRolesMock.mockResolvedValue([
      {
        id: 1,
        name: 'admin',
        description: null,
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
      {
        id: 2,
        name: 'planner',
        description: null,
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ]);
    listAuthUsersMock.mockResolvedValue([
      {
        id: 7,
        name: 'Planner User',
        email: 'planner@impeasy.local',
        isActive: true,
        roles: ['planner'],
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
      {
        id: 8,
        name: 'Operator User',
        email: 'operator@impeasy.local',
        isActive: true,
        roles: [],
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ]);
    replaceAuthUserRolesMock.mockResolvedValue({
      id: 8,
      name: 'Operator User',
      email: 'operator@impeasy.local',
      isActive: true,
      roles: ['admin', 'planner'],
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
    });

    render(<RolesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Users and roles' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'User' }), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'admin' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'planner' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save assignments' }));

    await waitFor(() => {
      expect(replaceAuthUserRolesMock).toHaveBeenCalledWith(8, {
        roleIds: [1, 2],
      });
    });

    expect(screen.getByText('User role assignments saved.')).toBeInTheDocument();
  });
});
