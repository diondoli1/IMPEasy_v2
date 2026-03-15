'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  getCurrentUser,
  listManufacturingOrders,
  listOperationQueue,
  listWorkstations,
  startOperation,
} from '../../lib/api';
import { formatDate } from '../../lib/commercial';
import type { AuthUser } from '../../types/auth';
import type { ManufacturingOrder } from '../../types/manufacturing-order';
import type { OperationQueueEntry } from '../../types/operation';
import type { Workstation } from '../../types/workstation';

/** Match operation workstation (from routing) to workstation name (from API). */
function operationMatchesWorkstation(opWorkstation: string | null, wsName: string): boolean {
  if (!opWorkstation) return false;
  return (
    opWorkstation === wsName ||
    wsName.includes(opWorkstation) ||
    opWorkstation.includes(wsName)
  );
}

/** A workstation is idle when it has no running or paused operations. */
function isWorkstationIdle(wsName: string, operations: OperationQueueEntry[]): boolean {
  const opsAtStation = operations.filter((o) => operationMatchesWorkstation(o.workstation, wsName));
  return !opsAtStation.some((o) => o.status === 'running' || o.status === 'paused');
}

export default function KioskPage(): JSX.Element {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [operations, setOperations] = useState<OperationQueueEntry[]>([]);
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [selectedWorkstation, setSelectedWorkstation] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [proceeding, setProceeding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [user, queue, moList, wsList] = await Promise.all([
          getCurrentUser(),
          listOperationQueue(),
          listManufacturingOrders(),
          listWorkstations(),
        ]);
        setCurrentUser(user);
        setOperations(queue);
        setManufacturingOrders(
          moList.filter(
            (mo) => mo.status === 'released' || mo.status === 'in_progress',
          ),
        );
        setWorkstations(wsList);
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
    return op.assignedOperatorId === null || op.assignedOperatorId === currentUser?.id;
  });

  /** Idle workstations: no running or paused operations at that station. */
  const idleWorkstations = workstations.filter((ws) =>
    isWorkstationIdle(ws.name, visibleOperations),
  );

  /** Manufacturing orders that have a ready operation for the selected workstation. */
  const ordersForWorkstation = selectedWorkstation
    ? manufacturingOrders.filter((mo) => {
        const readyOp = visibleOperations.find(
          (o) =>
            o.workOrderId === mo.id &&
            o.status === 'ready' &&
            operationMatchesWorkstation(o.workstation, selectedWorkstation),
        );
        return Boolean(readyOp);
      })
    : [];

  const handleWorkstationSelect = (wsName: string): void => {
    setSelectedWorkstation(wsName);
    setSelectedOrderId(null);
  };

  const handleProceedToMachine = async (orderId?: number): Promise<void> => {
    const moId = orderId ?? selectedOrderId;
    if (!selectedWorkstation || !moId) return;
    const op = visibleOperations.find(
      (o) =>
        o.workOrderId === moId &&
        o.status === 'ready' &&
        operationMatchesWorkstation(o.workstation, selectedWorkstation),
    );
    if (!op) {
      setError('No ready operation found for this order at this workstation.');
      return;
    }
    setProceeding(true);
    setError(null);
    try {
      await startOperation(op.id);
      router.push(`/kiosk/operations/${op.id}`);
    } catch {
      setError('Unable to start the job. It may have been taken by another operator.');
    } finally {
      setProceeding(false);
    }
  };

  const handleBackToWorkstations = (): void => {
    setSelectedWorkstation(null);
    setSelectedOrderId(null);
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading kiosk...</Typography>
      </Box>
    );
  }

  if (error && !proceeding && !currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">
          {error ?? 'Unable to load kiosk.'}
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">
          Unable to load kiosk.
        </Typography>
      </Box>
    );
  }

  /** Admin view: full kiosk with all workstations and backlog. */
  if (isAdmin) {
    const opsByWorkstation = workstations.reduce<Record<string, OperationQueueEntry[]>>(
      (acc, ws) => {
        acc[ws.name] = visibleOperations.filter((o) =>
          operationMatchesWorkstation(o.workstation, ws.name),
        );
        return acc;
      },
      {},
    );
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Kiosk (Admin)</Typography>
          <Button component={Link} href="/manufacturing-orders" variant="outlined">
            Manufacturing orders
          </Button>
        </Box>
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
            const ops = opsByWorkstation[ws.name] ?? [];
            const hasJob = ops.some((o) => o.status === 'running' || o.status === 'paused');
            const currentOp = ops.find((o) => o.status === 'running' || o.status === 'paused');
            return (
              <Card key={ws.id} sx={{ minHeight: 180 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: hasJob ? '#4caf50' : '#9e9e9e',
                      mb: 2,
                      boxShadow: 2,
                    }}
                  />
                  <Typography variant="h6" fontWeight={600}>{ws.name}</Typography>
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
                    <Button component={Link} href={`/manufacturing-orders/${mo.id}`} size="small">
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  /** Operator view: Step 1 – Select idle workstation */
  if (!selectedWorkstation) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Select workstation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose an available (idle) workstation to begin.
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          {idleWorkstations.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              No idle workstations. All stations are currently in use.
            </Typography>
          ) : (
            idleWorkstations.map((ws) => (
              <Card
                key={ws.id}
                sx={{
                  minHeight: 140,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                }}
                onClick={() => handleWorkstationSelect(ws.name)}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: '#9e9e9e',
                      mb: 1,
                      boxShadow: 2,
                    }}
                  />
                  <Typography variant="h6" fontWeight={600}>{ws.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Available</Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Box>
    );
  }

  /** Operator view: Step 2 – Select manufacturing order and Proceed */
  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        onClick={handleBackToWorkstations}
        sx={{ mb: 2 }}
      >
        ← Back to workstations
      </Button>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Workstation: {selectedWorkstation}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a manufacturing order and press Proceed to go to the machine.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Typography>
      )}

      {ordersForWorkstation.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3 }}>
          No manufacturing orders with ready operations at this workstation.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Due date</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {ordersForWorkstation.map((mo) => (
                <TableRow
                  key={mo.id}
                  hover
                  selected={selectedOrderId === mo.id}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedOrderId(mo.id)}
                >
                  <TableCell>{mo.documentNumber}</TableCell>
                  <TableCell>{mo.itemName}</TableCell>
                  <TableCell>{mo.quantity}</TableCell>
                  <TableCell>{formatDate(mo.dueDate)}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={proceeding}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleProceedToMachine(mo.id);
                      }}
                    >
                      {proceeding ? 'Starting...' : 'Proceed'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Button
        variant="contained"
        disabled={!selectedOrderId || proceeding}
        onClick={() => void handleProceedToMachine(selectedOrderId ?? undefined)}
        sx={{ mt: 1 }}
      >
        {proceeding ? 'Starting...' : 'Proceed to machine'}
      </Button>
    </Box>
  );
}
