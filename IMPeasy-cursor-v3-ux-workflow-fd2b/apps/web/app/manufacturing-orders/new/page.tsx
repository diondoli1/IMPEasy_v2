'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import {
  createManufacturingOrder,
  generateManufacturingOrdersForSalesOrder,
  listManufacturedItems,
  listSalesOrders,
} from '../../../lib/api';
import type { Item } from '../../../types/item';
import type { SalesOrder } from '../../../types/sales-order';

type CreateMode = 'direct' | 'from-order';

export default function NewManufacturingOrderPage(): JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>('direct');
  const [items, setItems] = useState<Item[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [dueDate, setDueDate] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [itemsRes, ordersRes] = await Promise.all([
          listManufacturedItems(),
          listSalesOrders(),
        ]);
        setItems(itemsRes);
        setSalesOrders(ordersRes.filter((o) => ['released', 'in_production'].includes(o.status)));
      } catch {
        setError('Unable to load data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const productGroups = useMemo(
    () => Array.from(new Set(items.map((i) => i.itemGroup).filter(Boolean))).sort() as string[],
    [items],
  );
  const itemsInGroup = useMemo(
    () =>
      selectedGroup ? items.filter((i) => i.itemGroup === selectedGroup) : items,
    [items, selectedGroup],
  );
  const selectedItem = useMemo(
    () => items.find((i) => String(i.id) === selectedItemId),
    [items, selectedItemId],
  );

  async function handleDirectCreate(): Promise<void> {
    if (!selectedItemId || !quantity || Number(quantity) < 1) {
      setError('Please select a product and enter a valid quantity.');
      return;
    }
    const item = items.find((i) => String(i.id) === selectedItemId);
    if (!item?.defaultRoutingId) {
      setError('Selected product must have a default routing. Configure routing in Production Planning → Routings.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createManufacturingOrder({
        itemId: Number(selectedItemId),
        quantity: Number(quantity),
        dueDate: dueDate || undefined,
      });
      router.replace(`/manufacturing-orders/${created.id}`);
    } catch {
      setError(
        'Unable to create manufacturing order. Ensure the product has a default BOM and routing.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateFromOrder(): Promise<void> {
    if (!selectedOrderId) {
      setError('Please select a customer order.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await generateManufacturingOrdersForSalesOrder(selectedOrderId);
      if (created.length > 0) {
        router.replace(`/manufacturing-orders/${created[0].id}`);
      } else {
        setMessage(
          'No manufacturing orders were generated. Ensure the order has lines with BOM and routing.',
        );
      }
    } catch {
      setError(
        'Unable to generate manufacturing orders. Confirm each line item has a default BOM and routing.',
      );
    } finally {
      setSaving(false);
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

      <Tabs value={mode} onChange={(_, v) => setMode(v as CreateMode)} sx={{ mb: 2 }}>
        <Tab label="Direct create" value="direct" />
        <Tab label="From customer order" value="from-order" />
      </Tabs>

      {mode === 'direct' ? (
        <Paper sx={{ p: 2, maxWidth: 480 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a manufacturing order directly for a product. The product must have a default
            routing (and BOM if it has components).
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Product group</InputLabel>
            <Select
              value={selectedGroup}
              label="Product group"
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedItemId('');
              }}
            >
              <MenuItem value="">
                <em>All groups</em>
              </MenuItem>
              {productGroups.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Product</InputLabel>
            <Select
              value={selectedItemId}
              label="Product"
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <MenuItem value="">
                <em>Select product</em>
              </MenuItem>
              {itemsInGroup.map((i) => (
                <MenuItem key={i.id} value={i.id}>
                  {i.code ?? i.name} — {i.name}
                  {!i.defaultRoutingId ? ' (no routing)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          {selectedItem && !selectedItem.defaultRoutingId ? (
            <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
              This product has no default routing. Create a routing in Production Planning →
              Routings first.
            </Typography>
          ) : null}
          <Button
            variant="contained"
            onClick={() => void handleDirectCreate()}
            disabled={saving || !selectedItemId || !quantity || Number(quantity) < 1}
          >
            {saving ? 'Creating...' : 'Save'}
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 2, maxWidth: 480 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manufacturing orders are created from released customer orders. Select a released order
            to generate manufacturing orders for its line items (each item must have a BOM and
            routing).
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
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
          <Button
            variant="contained"
            onClick={() => void handleGenerateFromOrder()}
            disabled={saving || !selectedOrderId}
            sx={{ mt: 1 }}
          >
            {saving ? 'Generating...' : 'Generate'}
          </Button>
        </Paper>
      )}
    </Box>
  );
}
