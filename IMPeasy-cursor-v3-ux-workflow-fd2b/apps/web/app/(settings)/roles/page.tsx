'use client';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import { listAuthRoles, listAuthUsers, replaceAuthUserRoles } from '../../../lib/api';
import type { AuthRole, AuthUser } from '../../../types/auth';

const UX_ROLES = ['admin', 'operator'] as const;

export default function UserRolesPage(): JSX.Element {
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [roleByUserId, setRoleByUserId] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [loadedRoles, loadedUsers] = await Promise.all([
          listAuthRoles(),
          listAuthUsers(),
        ]);
        setRoles(loadedRoles);
        setUsers(loadedUsers);
        const initial: Record<number, string> = {};
        for (const u of loadedUsers) {
          const primary = u.roles.find((r) => UX_ROLES.includes(r as typeof UX_ROLES[number]));
          initial[u.id] = primary ?? 'operator';
        }
        setRoleByUserId(initial);
      } catch {
        setError('Unable to load users and roles.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRoleChange = async (userId: number, roleName: string) => {
    const role = roles.find((r) => r.name === roleName);
    if (!role) return;
    setSavingId(userId);
    setError(null);
    try {
      const updated = await replaceAuthUserRoles(userId, { roleIds: [role.id] });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setRoleByUserId((prev) => ({ ...prev, [userId]: roleName }));
    } catch {
      setError('Unable to save role assignment.');
    } finally {
      setSavingId(null);
    }
  };

  const adminRole = roles.find((r) => r.name === 'admin');
  const operatorRole = roles.find((r) => r.name === 'operator');
  const hasRoles = Boolean(adminRole && operatorRole);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading users and roles...</Typography>
      </Box>
    );
  }

  if (error && users.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        User roles
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Assign Admin or Operator to each user.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Typography>
      )}

      {!hasRoles && (
        <Typography color="warning.main" sx={{ mb: 2 }}>
          Admin and Operator roles must exist in the system.
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={roleByUserId[user.id] ?? 'operator'}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as string)
                      }
                      disabled={!hasRoles || savingId === user.id}
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="operator">Operator</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
