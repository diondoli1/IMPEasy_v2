'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
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
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import {
  getCurrentUser,
  listManufacturingOrders,
  listOperationQueue,
} from '../../lib/api';
import { formatDate } from '../../lib/commercial';
import type { AuthUser } from '../../types/auth';
import type { ManufacturingOrder } from '../../types/manufacturing-order';
import type { OperationQueueEntry } from '../../types/operation';

type WorkstationStatus = 'idle' | 'on_job' | 'setup' | 'alarm';

function workstationStatusFromOperations(
  ops: OperationQueueEntry[],
): WorkstationStatus {
  if (ops.some((o) => o.status === 'running')) return 'on_job';
  if (ops.some((o) => o.status === 'paused')) return 'setup';
  if (ops.some((o) => o.status === 'ready')) return 'idle';
  return 'idle';
}

function statusColor(status: WorkstationStatus): string {
  switch (status) {
    case 'idle':
      return '#9e9e9e';
    case 'on_job':
      return '#4caf50';
    case 'setup':
      return '#ffeb3b';
    case 'alarm':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}

const WORKSTATION_SELECT_KEY = 'kiosk-selected-workstation';

export default function KioskPage(): JSX.Element {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [operations, setOperations] = useState<OperationQueueEntry[]>([]);
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>([]);
  const [selectedWorkstation, setSelectedWorkstation] = useState<string | null>(null);
  const [workstationDialogOpen, setWorkstationDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [user, queue, moList] = await Promise.all([
          getCurrentUser(),
          listOperationQueue(),
          listManufacturingOrders(),
        ]);
        setCurrentUser(user);
        setOperations(queue);
        setManufacturingOrders(
          moList.filter(
            (mo) =>
              mo.status === 'released' || mo.status === 'in_progress',
          ),
        );
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem(WORKSTATION_SELECT_KEY) : null;
        if (stored) setSelectedWorkstation(stored);
      } catch {
        setError('Unable to load kiosk data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isAdmin = currentUser?.roles.includes('admin') ?? false;

  const visibleOperations = operations.filter((op) => {
    if (!['ready', 'running', 'paused'].includes(op.status)) return false;
    if (isAdmin) return true;
    return op.assignedOperatorId === currentUser?.id;
  });

  const workstations = Array.from(
    new Set(
      visibleOperations
        .map((o) => o.workstation)
        .filter((w): w is string => Boolean(w)),
    ),
  ).sort();

  const opsByWorkstation = workstations.reduce<Record<string, OperationQueueEntry[]>>(
    (acc, ws) => {
      acc[ws] = visibleOperations.filter((o) => o.workstation === ws);
      return acc;
    },
    {},
  );

  const handleWorkstationProceed = () => {
    if (selectedWorkstation) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(WORKSTATION_SELECT_KEY, selectedWorkstation);
      }
      setWorkstationDialogOpen(false);
    }
  };

  useEffect(() => {
    if (!loading && !isAdmin && workstations.length > 0 && !selectedWorkstation) {
      setWorkstationDialogOpen(true);
    }
  }, [loading, isAdmin, workstations.length, selectedWorkstation]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading kiosk...</Typography>
      </Box>
    );
  }

  if (error || !currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">
          {error ?? 'Unable to load kiosk.'}
        </Typography>
      </Box>
    );
  }

  const filteredOps = selectedWorkstation
    ? visibleOperations.filter((o) => o.workstation === selectedWorkstation)
    : visibleOperations;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Kiosk</Typography>
        {isAdmin && (
          <Button component={Link} href="/manufacturing-orders" variant="outlined">
            Manufacturing orders
          </Button>
        )}
      </Box>

      {isAdmin && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Workstations
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 3,
              mb: 3,
            }}
          >
            {workstations.map((ws) => {
              const ops = opsByWorkstation[ws] ?? [];
              const status = workstationStatusFromOperations(ops);
              const currentOp = ops.find((o) => o.status === 'running' || o.status === 'paused');
              return (
                <Card key={ws} sx={{ minHeight: 180 }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: statusColor(status),
                        mb: 2,
                        boxShadow: 2,
                      }}
                      title={status === 'idle' ? 'Idle' : status === 'on_job' ? 'On job' : status === 'setup' ? 'Setup' : 'Alarm'}
                    />
                    <Typography variant="h6" fontWeight={600}>{ws}</Typography>
                    {currentOp && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                        {currentOp.workOrderNumber} – {currentOp.itemName}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Manufacturing backlog
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Number</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due date</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {manufacturingOrders.slice(0, 20).map((mo) => (
                  <TableRow key={mo.id} hover>
                    <TableCell>{mo.documentNumber}</TableCell>
                    <TableCell>{mo.itemName}</TableCell>
                    <TableCell>{mo.quantity}</TableCell>
                    <TableCell>{mo.status}</TableCell>
                    <TableCell>{formatDate(mo.dueDate)}</TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        href={`/manufacturing-orders/${mo.id}`}
                        size="small"
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {!isAdmin && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">
              {selectedWorkstation ? `Workstation: ${selectedWorkstation}` : 'Select a workstation'}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setWorkstationDialogOpen(true)}
            >
              Change workstation
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {filteredOps.map((op) => (
              <Card key={op.id} sx={{ minWidth: 220 }}>
                <CardContent>
                  <Typography fontWeight={600}>{op.operationName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {op.workOrderNumber} – {op.itemName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Qty {op.plannedQuantity}
                  </Typography>
                  <Button
                    component={Link}
                    href={`/kiosk/operations/${op.id}`}
                    variant="contained"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Start job
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      <Dialog open={workstationDialogOpen} onClose={() => setWorkstationDialogOpen(false)}>
        <DialogTitle>Select a workstation</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, minWidth: 200 }}>
            <InputLabel>Workstation</InputLabel>
            <Select
              value={selectedWorkstation ?? ''}
              label="Workstation"
              onChange={(e) => setSelectedWorkstation(e.target.value || null)}
            >
              <MenuItem value="">
                <em>Select</em>
              </MenuItem>
              {workstations.map((ws) => (
                <MenuItem key={ws} value={ws}>
                  {ws}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkstationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleWorkstationProceed} disabled={!selectedWorkstation}>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
