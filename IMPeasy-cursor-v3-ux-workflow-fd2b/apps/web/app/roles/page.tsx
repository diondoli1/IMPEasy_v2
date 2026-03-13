'use client';

import React, { FormEvent, useEffect, useState } from 'react';

import { PageShell } from '../../components/ui/page-templates';
import {
  Badge,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  Field,
  Notice,
  Panel,
} from '../../components/ui/primitives';
import { listAuthRoles, listAuthUsers, replaceAuthUserRoles } from '../../lib/api';
import {
  FIXED_ROLE_DESCRIPTIONS,
  FIXED_ROLE_ORDER,
  LANDING_PATH_BY_ROLE,
} from '../../lib/navigation';
import type { AuthRole, AuthUser } from '../../types/auth';

type FixedRoleRow = {
  name: string;
  description: string;
  landing: string;
  status: 'ready' | 'missing';
};

export default function RolesPage(): JSX.Element {
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(null);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const [loadedRoles, loadedUsers] = await Promise.all([listAuthRoles(), listAuthUsers()]);
        if (isCancelled) {
          return;
        }

        setRoles(loadedRoles);
        setUsers(loadedUsers);
        setSelectedUserId(loadedUsers.length > 0 ? `${loadedUsers[0].id}` : '');
      } catch {
        if (!isCancelled) {
          setError('Unable to load role management data.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const fixedRoleRows: FixedRoleRow[] = FIXED_ROLE_ORDER.map((roleName) => ({
    name: roleName,
    description: FIXED_ROLE_DESCRIPTIONS[roleName],
    landing: LANDING_PATH_BY_ROLE[roleName],
    status: roles.some((role) => role.name === roleName) ? 'ready' : 'missing',
  }));

  const availableRoles = FIXED_ROLE_ORDER.map((roleName) => roles.find((role) => role.name === roleName)).filter(
    (role): role is AuthRole => role !== undefined,
  );

  const legacyRoles = roles.filter(
    (role) => !FIXED_ROLE_ORDER.includes(role.name as (typeof FIXED_ROLE_ORDER)[number]),
  );

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedRoleIds([]);
      return;
    }

    const activeUser = users.find((user) => `${user.id}` === selectedUserId);
    if (!activeUser) {
      setSelectedRoleIds([]);
      return;
    }

    const currentAvailableRoles = FIXED_ROLE_ORDER.map((roleName) =>
      roles.find((role) => role.name === roleName),
    ).filter((role): role is AuthRole => role !== undefined);

    const roleIds = activeUser.roles
      .map((roleName) => currentAvailableRoles.find((role) => role.name === roleName)?.id)
      .filter((roleId): roleId is number => roleId !== undefined)
      .sort((left, right) => left - right);

    setSelectedRoleIds(roleIds);
  }, [roles, selectedUserId, users]);

  const toggleRoleSelection = (roleId: number): void => {
    setAssignmentSuccess(null);
    setSelectedRoleIds((currentRoleIds) => {
      if (currentRoleIds.includes(roleId)) {
        return currentRoleIds.filter((candidate) => candidate !== roleId);
      }

      return [...currentRoleIds, roleId].sort((left, right) => left - right);
    });
  };

  const handleSaveAssignments = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setAssignmentError(null);
    setAssignmentSuccess(null);

    const userId = Number.parseInt(selectedUserId, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      setAssignmentError('User is required.');
      return;
    }

    setIsSavingAssignments(true);
    try {
      const updatedUser = await replaceAuthUserRoles(userId, {
        roleIds: [...selectedRoleIds].sort((left, right) => left - right),
      });

      setUsers((currentUsers) =>
        currentUsers.map((candidate) => (candidate.id === updatedUser.id ? updatedUser : candidate)),
      );
      setAssignmentSuccess('User role assignments saved.');
    } catch {
      setAssignmentError('Unable to save role assignments.');
    } finally {
      setIsSavingAssignments(false);
    }
  };

  if (isLoading) {
    return <p>Loading role management...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <PageShell
      eyebrow="Settings"
      title="Users and roles"
      description="Admin-only role assignment page aligned to the fixed MVP role model. Arbitrary role creation is intentionally removed from the shell slice."
      actions={<ButtonLink href="/settings/company" tone="primary">Open company settings</ButtonLink>}
    >
      <div className="split-grid">
        <div className="page-stack">
          <Panel title="Fixed role set" description="Only the four approved MVP roles should appear here.">
            <DataTable
              columns={[
                { header: 'Role', width: '110px', cell: (row) => <strong>{row.name}</strong> },
                {
                  header: 'Landing',
                  width: '220px',
                  cell: (row) => <span className="mono">{row.landing}</span>,
                },
                {
                  header: 'Status',
                  width: '120px',
                  cell: (row) => (
                    <Badge tone={row.status === 'ready' ? 'success' : 'warning'}>
                      {row.status === 'ready' ? 'ready' : 'missing'}
                    </Badge>
                  ),
                },
                { header: 'Description', cell: (row) => row.description },
              ]}
              rows={fixedRoleRows}
              getRowKey={(row) => row.name}
            />

            {fixedRoleRows.some((row) => row.status === 'missing') ? (
              <Notice title="Missing fixed roles" tone="warning">
                Seed or create the fixed roles `admin`, `office`, `planner`, and `operator` before the manual checkpoint so each test user can land in the correct workspace.
              </Notice>
            ) : null}

            {legacyRoles.length > 0 ? (
              <Notice title="Legacy roles present" tone="warning">
                Extra roles are ignored by the shell navigation. Keep the active MVP scope on the fixed four-role set only.
              </Notice>
            ) : null}
          </Panel>

          <Panel title="Assign roles by user" description="User assignment remains available, but only within the fixed role set.">
            <form onSubmit={(event) => void handleSaveAssignments(event)} className="page-stack">
              <Field label="User">
                <select
                  className="control"
                  aria-label="User"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </Field>

              {availableRoles.length > 0 ? (
                <div className="page-stack">
                  {availableRoles.map((role) => (
                    <label key={role.id} className="link-list__item">
                      <span>
                        <strong>{role.name}</strong>
                        <span className="muted-copy"> · {FIXED_ROLE_DESCRIPTIONS[role.name as keyof typeof FIXED_ROLE_DESCRIPTIONS]}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => toggleRoleSelection(role.id)}
                        aria-label={role.name}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No fixed roles available"
                  description="Load the four approved roles first, then assign them to the seeded users for the shell checkpoint."
                />
              )}

              {assignmentError ? (
                <Notice title="Unable to save" tone="warning">
                  <span role="alert">{assignmentError}</span>
                </Notice>
              ) : null}

              {assignmentSuccess ? <Notice title="Saved">{assignmentSuccess}</Notice> : null}

              <div className="page-shell__actions">
                <Button type="submit" tone="primary" disabled={isSavingAssignments || availableRoles.length === 0}>
                  {isSavingAssignments ? 'Saving assignments...' : 'Save assignments'}
                </Button>
              </div>
            </form>
          </Panel>
        </div>

        <div className="page-stack">
          <Panel title="Users and assigned roles" description="Current users should map directly to the review personas from MVP-003.">
            <DataTable
              columns={[
                { header: 'User', cell: (row) => <strong>{row.name}</strong> },
                { header: 'Email', cell: (row) => <span className="mono">{row.email}</span> },
                {
                  header: 'Status',
                  width: '110px',
                  cell: (row) => (
                    <Badge tone={row.isActive ? 'success' : 'warning'}>
                      {row.isActive ? 'active' : 'inactive'}
                    </Badge>
                  ),
                },
                {
                  header: 'Roles',
                  cell: (row) =>
                    row.roles.length > 0 ? (
                      <div className="badge-row">
                        {row.roles.map((role) => (
                          <Badge key={`${row.id}-${role}`} tone="info">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="muted-copy">none</span>
                    ),
                },
              ]}
              rows={users}
              getRowKey={(row) => `${row.id}`}
            />
          </Panel>

          <Panel title="Checkpoint focus" description="What to verify on the admin screen.">
            <Notice title="Visual review">
              Check the dense table + form pairing, the fixed-role messaging, and the way admin subtabs stay visible while working inside the page.
            </Notice>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
