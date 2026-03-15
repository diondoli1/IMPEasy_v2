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
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { formatDate } from '../../lib/commercial';
import { listPurchaseOrders } from '../../lib/api';
import type { PurchaseOrder } from '../../types/purchase-order';

export default function PurchaseOrdersPage(): JSX.Element {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setOrders(await listPurchaseOrders());
      } catch {
        setError('Unable to load purchase orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading purchase orders...</Typography>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Purchase Orders</Typography>
        <Button
          component={Link}
          href="/purchase-orders/new"
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
              <TableCell>Created</TableCell>
              <TableCell>Expected date</TableCell>
              <TableCell>Vendor number</TableCell>
              <TableCell>Vendor name</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((po) => (
              <TableRow key={po.id} hover>
                <TableCell>{po.number}</TableCell>
                <TableCell>{formatDate(po.createdAt)}</TableCell>
                <TableCell>{formatDate(po.expectedDate)}</TableCell>
                <TableCell>{po.supplierCode ?? po.supplierId}</TableCell>
                <TableCell>{po.supplierName}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Edit"
                    onClick={() => router.push(`/purchase-orders/${po.id}`)}
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
