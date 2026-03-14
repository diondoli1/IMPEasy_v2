'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  createShipment,
  getSalesOrderShippingAvailability,
  listSalesOrders,
} from '../../../../lib/api';
import type { SalesOrder } from '../../../../types/sales-order';
import type { ShipmentInput } from '../../../../types/shipment';

const SHIPMENT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Ready for shipment' },
  { value: 'packed', label: 'Shipment' },
];

export default function CreateShipmentPage(): JSX.Element {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const list = await listSalesOrders();
        const ready = list.filter(
          (o) => o.status === 'released' || o.status === 'in_production',
        );
        setOrders(ready);
      } catch {
        setError('Unable to load customer orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!selectedOrderId) {
      setError('Please select a customer order.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const availability = await getSalesOrderShippingAvailability(selectedOrderId);
      const lines = availability
        .filter((line) => line.remainingQuantity > 0)
        .map((line) => ({
          salesOrderLineId: line.salesOrderLineId,
          quantity: line.remainingQuantity,
        }));
      if (lines.length === 0) {
        setError('No remaining quantity to ship for this order.');
        setSaving(false);
        return;
      }
      const input: ShipmentInput = {
        salesOrderId: selectedOrderId,
        lines,
        notes: shippingAddress ? `Shipping: ${shippingAddress}` : undefined,
      };
      const shipment = await createShipment(input);
      router.replace(`/shipments/${shipment.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create shipment.');
    } finally {
      setSaving(false);
    }
  };

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
        Create a new shipment
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button component={Link} href="/stock/shipments" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Save
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
        <FormControl fullWidth>
          <InputLabel>Customer Order</InputLabel>
          <Select
            value={selectedOrderId}
            label="Customer Order"
            onChange={(e) => setSelectedOrderId(e.target.value as number | '')}
          >
            <MenuItem value="">
              <em>Select order</em>
            </MenuItem>
            {orders.map((o) => (
              <MenuItem key={o.id} value={o.id}>
                {o.documentNumber ?? `Order #${o.id}`} – {o.customerName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Delivery Date"
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
          >
            {SHIPMENT_STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Shipping Address"
          multiline
          rows={3}
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
        />
      </Box>
    </Box>
  );
}
