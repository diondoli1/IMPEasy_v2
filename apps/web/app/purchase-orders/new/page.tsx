'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  createPurchaseOrder,
  createPurchaseOrderLine,
  listItems,
  listProductGroups,
  listSuppliers,
} from '../../../lib/api';
import { InlineCreateItemDialog } from '../../../components/inline-create-item-dialog';
import { InlineCreateProductGroupDialog } from '../../../components/inline-create-product-group-dialog';
import type { Item } from '../../../types/item';
import type { ProductGroup } from '../../../types/stock-settings';
import type { Supplier } from '../../../types/supplier';
import { SCROLLABLE_SELECT_MENU_PROPS } from '../../../lib/select-utils';

type LineRow = {
  id: string;
  itemId: number | '';
  itemCode: string;
  itemGroup: string;
  quantity: number;
  unitPrice: number;
};

function toDateInput(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NewPurchaseOrderPage(): JSX.Element {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [addProductGroupDialogOpen, setAddProductGroupDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [addProductLineId, setAddProductLineId] = useState<string | null>(null);
  const [orderDate, setOrderDate] = useState(toDateInput(new Date()));
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineRow[]>([
    { id: '1', itemId: '', itemCode: '', itemGroup: '', quantity: 1, unitPrice: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [suppliersData, itemsData, groupsData] = await Promise.all([
          listSuppliers(),
          listItems(),
          listProductGroups(),
        ]);
        setSuppliers(suppliersData);
        setItems(itemsData);
        setProductGroups(groupsData);
      } catch {
        setError('Unable to load suppliers and items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addLine = (): void => {
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        itemId: '',
        itemCode: '',
        itemGroup: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeLine = (id: string): void => {
    setLines((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const updateLine = (id: string, updates: Partial<LineRow>): void => {
    setLines((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...updates };
        if (updates.itemId !== undefined && updates.itemId !== '') {
          const item = items.find((i) => i.id === updates.itemId);
          if (item) {
            next.itemCode = item.code;
            next.itemGroup = item.itemGroup ?? '';
          }
        }
        if (updates.itemGroup !== undefined) {
          next.itemGroup = updates.itemGroup;
        }
        return next;
      }),
    );
  };

  const productGroupNames = Array.from(
    new Set([
      ...productGroups.map((g) => g.name),
      ...lines.map((r) => r.itemGroup).filter(Boolean),
    ]),
  ).sort();

  const handleSave = async (): Promise<void> => {
    const sid = Number(supplierId);
    if (!supplierId || sid < 1 || Number.isNaN(sid)) {
      setError('Vendor is required.');
      return;
    }
    const validLines = lines.filter((l) => l.itemId !== '' && l.quantity > 0);
    if (validLines.length === 0) {
      setError('Add at least one line item.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const po = await createPurchaseOrder({
        supplierId: sid,
        orderDate: orderDate || undefined,
        expectedDate: expectedDate || undefined,
        notes: notes.trim() || undefined,
      });

      for (const line of validLines) {
        await createPurchaseOrderLine(po.id, {
          itemId: Number(line.itemId),
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        });
      }

      router.replace(`/purchase-orders/${po.id}`);
    } catch {
      setError('Unable to create purchase order.');
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

  if (error && !saving) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">{error}</Typography>
        <Button component={Link} href="/purchase-orders" sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          component={Link}
          href="/purchase-orders"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        <Typography variant="h6">Create Purchase Order</Typography>
        <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {error && saving && (
        <Typography color="error" sx={{ mb: 2 }} role="alert">{error}</Typography>
      )}

      <Paper sx={{ p: 2, mb: 3, maxWidth: 640 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Header</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Vendor</InputLabel>
            <Select
              value={String(supplierId)}
              label="Vendor"
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <MenuItem value="">Select vendor</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Order Date"
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            label="Expected date"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
        </Box>
        <TextField
          label="Notes"
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
        />
      </Paper>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Line items</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product group</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Ordered quantity</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Select
                    size="small"
                    value={row.itemGroup || ''}
                    displayEmpty
                    onChange={(e) => {
                      const v = String(e.target.value ?? '');
                      if (v === '__add_new__') {
                        setAddProductLineId(row.id);
                        setAddProductGroupDialogOpen(true);
                      } else {
                        updateLine(row.id, { itemGroup: v });
                      }
                    }}
                    sx={{ minWidth: 140 }}
                    MenuProps={SCROLLABLE_SELECT_MENU_PROPS}
                  >
                    <MenuItem value="">Select product group</MenuItem>
                    <MenuItem value="__add_new__">Add new product group</MenuItem>
                    {productGroupNames.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={row.itemId}
                    displayEmpty
                    onChange={(e) => {
                      const v = String(e.target.value ?? '');
                      if (v === '__add_new__') {
                        setAddProductLineId(row.id);
                        setAddProductDialogOpen(true);
                      } else {
                        updateLine(row.id, {
                          itemId: v === '' ? '' : Number(v),
                        });
                      }
                    }}
                    sx={{ minWidth: 180 }}
                    MenuProps={SCROLLABLE_SELECT_MENU_PROPS}
                  >
                    <MenuItem value="">Select product</MenuItem>
                    <MenuItem value="__add_new__">Add new product</MenuItem>
                    {items
                      .filter(
                        (item) =>
                          !row.itemGroup || (item.itemGroup ?? '') === row.itemGroup,
                      )
                      .map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name} {item.code ? `(${item.code})` : ''}
                        </MenuItem>
                      ))}
                  </Select>
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={row.quantity}
                    onChange={(e) =>
                      updateLine(row.id, { quantity: Math.max(0, Number(e.target.value) || 0) })
                    }
                    inputProps={{ min: 0 }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={row.unitPrice}
                    onChange={(e) =>
                      updateLine(row.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ width: 100 }}
                  />
                </TableCell>
                <TableCell align="right">
                  {(row.quantity * row.unitPrice).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Remove line"
                    onClick={() => removeLine(row.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 1 }}>
        Add line
      </Button>
      <InlineCreateProductGroupDialog
        open={addProductGroupDialogOpen}
        onClose={() => {
          setAddProductGroupDialogOpen(false);
          setAddProductLineId(null);
        }}
        onCreated={(created) => {
          setProductGroups((prev) => [...prev, created]);
          if (addProductLineId) {
            updateLine(addProductLineId, { itemGroup: created.name });
          }
          setAddProductGroupDialogOpen(false);
          setAddProductLineId(null);
        }}
      />
      <InlineCreateItemDialog
        open={addProductDialogOpen}
        onClose={() => {
          setAddProductDialogOpen(false);
          setAddProductLineId(null);
        }}
        onCreated={(created) => {
          setItems((prev) => [...prev, created]);
          if (addProductLineId) {
            updateLine(addProductLineId, {
              itemId: created.id,
              itemCode: created.code ?? '',
              itemGroup: created.itemGroup ?? '',
            });
          }
          setAddProductDialogOpen(false);
          setAddProductLineId(null);
        }}
      />
    </Box>
  );
}
