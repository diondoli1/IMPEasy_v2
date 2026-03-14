'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  generateManufacturingOrdersForSalesOrder,
  listSalesOrders,
} from '../../../lib/api';
import type { SalesOrder } from '../../../types/sales-order';

export default function NewManufacturingOrderPage(): JSX.Element {
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const orders = await listSalesOrders();
        setSalesOrders(orders.filter((o) => ['released', 'in_production'].includes(o.status)));
      } catch {
        setError('Unable to load sales orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleGenerate(): Promise<void> {
    if (!selectedOrderId) {
      setError('Please select a customer order.');
      return;
    }
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const created = await generateManufacturingOrdersForSalesOrder(selectedOrderId);
      if (created.length > 0) {
        router.replace(`/manufacturing-orders/${created[0].id}`);
      } else {
        setMessage('No manufacturing orders were generated. Ensure the order has lines with BOM and routing.');
      }
    } catch {
      setError(
        'Unable to generate manufacturing orders. Confirm each line item has a default BOM and routing.',
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Create a manufacturing order
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          component={Link}
          href="/manufacturing-orders"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleGenerate()}
          disabled={generating || !selectedOrderId}
        >
          {generating ? 'Generating...' : 'Generate'}
        </Button>
      </Box>
      {error ? (
        <Typography color="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      {message ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>
      ) : null}
      <Paper sx={{ p: 2, maxWidth: 480 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manufacturing orders are created from released customer orders. Select a released order to
          generate manufacturing orders for its line items (each item must have a BOM and routing).
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Customer Order</InputLabel>
          <Select
            value={selectedOrderId}
            label="Customer Order"
            onChange={(e) => setSelectedOrderId(e.target.value as number | '')}
          >
            <MenuItem value="">
              <em>Select customer order</em>
            </MenuItem>
            {salesOrders.map((o) => (
              <MenuItem key={o.id} value={o.id}>
                {o.documentNumber} — {o.customerName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {salesOrders.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No released customer orders available. Release a customer order first from the Customer
            Orders module.
          </Typography>
        ) : null}
      </Paper>
    </Box>
  );
}
