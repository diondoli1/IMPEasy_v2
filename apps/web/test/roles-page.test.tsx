import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import RolesPage from '../app/(settings)/roles/page';
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

  it('loads users and roles table', async () => {
    listAuthRolesMock.mockResolvedValue([
      { id: 1, name: 'admin', description: null, createdAt: '', updatedAt: '' },
      { id: 4, name: 'operator', description: null, createdAt: '', updatedAt: '' },
    ]);
    listAuthUsersMock.mockResolvedValue([
      {
        id: 7,
        name: 'Planner User',
        email: 'planner@impeasy.local',
        isActive: true,
        roles: ['planner'],
        createdAt: '',
        updatedAt: '',
      },
    ]);

    render(<RolesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'User roles' })).toBeInTheDocument();
    });

    expect(screen.getByText('planner@impeasy.local')).toBeInTheDocument();
    expect(screen.getByText('Planner User')).toBeInTheDocument();
  });

  it('warns when admin or operator roles are missing', async () => {
    listAuthRolesMock.mockResolvedValue([
      { id: 1, name: 'admin', description: null, createdAt: '', updatedAt: '' },
    ]);
    listAuthUsersMock.mockResolvedValue([]);

    render(<RolesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Admin and Operator roles must exist/)).toBeInTheDocument();
    });
  });

  it('updates user role via dropdown and saves', async () => {
    listAuthRolesMock.mockResolvedValue([
      { id: 1, name: 'admin', description: null, createdAt: '', updatedAt: '' },
      { id: 4, name: 'operator', description: null, createdAt: '', updatedAt: '' },
    ]);
    listAuthUsersMock.mockResolvedValue([
      {
        id: 8,
        name: 'Operator User',
        email: 'operator@impeasy.local',
        isActive: true,
        roles: ['operator'],
        createdAt: '',
        updatedAt: '',
      },
    ]);
    replaceAuthUserRolesMock.mockResolvedValue({
      id: 8,
      name: 'Operator User',
      email: 'operator@impeasy.local',
      isActive: true,
      roles: ['admin'],
      createdAt: '',
      updatedAt: '',
    });

    render(<RolesPage />);

    await waitFor(() => {
      expect(screen.getByText('Operator User')).toBeInTheDocument();
    });

    const comboboxes = screen.getAllByRole('combobox');
    const roleCombobox = comboboxes[comboboxes.length - 1];
    fireEvent.mouseDown(roleCombobox);
    const adminOption = screen.getByRole('option', { name: 'Admin' });
    fireEvent.click(adminOption);

    await waitFor(() => {
      expect(replaceAuthUserRolesMock).toHaveBeenCalledWith(8, { roleIds: [1] });
    });
  });
});
