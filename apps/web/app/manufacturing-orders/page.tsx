'use client';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { listManufacturingOrders, listManufacturingOrdersBySalesOrder } from '../../lib/api';
import { formatProductionDate } from '../../lib/production';
import type { ManufacturingOrder } from '../../types/manufacturing-order';

export default function ManufacturingOrdersPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const salesOrderIdParam = searchParams.get('salesOrderId');
  const salesOrderId = salesOrderIdParam != null && salesOrderIdParam !== '' ? Number(salesOrderIdParam) : null;
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        if (salesOrderId != null && !Number.isNaN(salesOrderId)) {
          setOrders(await listManufacturingOrdersBySalesOrder(salesOrderId));
        } else {
          setOrders(await listManufacturingOrders());
        }
      } catch {
        setError('Unable to load manufacturing orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, [salesOrderId]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading manufacturing orders...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {salesOrderId != null && !Number.isNaN(salesOrderId) ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing manufacturing orders for this sales order.
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Manufacturing Orders</Typography>
        <Button
          component={Link}
          href="/manufacturing-orders/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          +Create
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Group Name</TableCell>
              <TableCell>Part No</TableCell>
              <TableCell>Part desc</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Part Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Finish</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography
                    component="span"
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => router.push(`/manufacturing-orders/${order.id}`)}
                  >
                    {order.documentNumber}
                  </Typography>
                </TableCell>
                <TableCell>{order.itemName}</TableCell>
                <TableCell>{order.itemCode}</TableCell>
                <TableCell>{order.itemName}</TableCell>
                <TableCell align="right">{order.quantity}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{order.releaseState}</TableCell>
                <TableCell>{formatProductionDate(order.dueDate)}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Edit manufacturing order"
                    onClick={() => router.push(`/manufacturing-orders/${order.id}`)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
