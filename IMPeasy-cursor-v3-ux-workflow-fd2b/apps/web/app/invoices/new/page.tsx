'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  createInvoice,
  getSalesOrder,
  listCustomers,
  listSalesOrders,
} from '../../../lib/api';
import { formatCurrency } from '../../../lib/commercial';
import type { CreateInvoiceInput } from '../../../types/invoice';
import type { SalesOrder, SalesOrderLine } from '../../../types/sales-order';
import type { Customer } from '../../../types/customer';

type LineRow = {
  salesOrderLineId: number;
  itemCode: string | null;
  itemName: string | null;
  itemGroup: string | null;
  quantity: number;
  unitPrice: number;
  unit: string;
  lineTotal: number;
  deliveryDate: string | null;
};

function toLineRows(lines: SalesOrderLine[]): LineRow[] {
  return lines.map((line) => ({
    salesOrderLineId: line.id,
    itemCode: line.itemCode,
    itemName: line.itemName,
    itemGroup: null,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    unit: line.unit,
    lineTotal: line.lineTotal,
    deliveryDate: line.deliveryDateOverride,
  }));
}

export default function NewInvoicePage(): JSX.Element {
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [invoiceType, setInvoiceType] = useState<'quotation' | 'invoice' | 'proforma_invoice'>('invoice');
  const [status, setStatus] = useState<'unpaid' | 'paid' | 'dummy'>('unpaid');
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [lineRows, setLineRows] = useState<LineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [orders, custs] = await Promise.all([
          listSalesOrders(),
          listCustomers(),
        ]);
        setSalesOrders(orders);
        setCustomers(custs);
      } catch {
        setError('Unable to load data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedOrderId) {
      setLineRows([]);
      setCustomerId('');
      return;
    }
    void (async () => {
      try {
        const order = await getSalesOrder(selectedOrderId);
        setCustomerId(order.customerId);
        setLineRows(toLineRows(order.salesOrderLines));
        if (order.billingAddress?.street || order.billingAddress?.city) {
          const addr = [
            order.billingAddress.street,
            order.billingAddress.city,
            order.billingAddress.postcode,
            order.billingAddress.country,
          ]
            .filter(Boolean)
            .join(', ');
          setBillingAddress(addr);
        }
      } catch {
        setError('Unable to load sales order.');
      }
    })();
  }, [selectedOrderId]);

  function updateLineQuantity(index: number, quantity: number): void {
    setLineRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const lineTotal = Number((quantity * row.unitPrice).toFixed(2));
        return { ...row, quantity, lineTotal };
      }),
    );
  }

  function updateLinePrice(index: number, unitPrice: number): void {
    setLineRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const lineTotal = Number((row.quantity * unitPrice).toFixed(2));
        return { ...row, unitPrice, lineTotal };
      }),
    );
  }

  function removeLine(index: number): void {
    setLineRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(): Promise<void> {
    if (!selectedOrderId || !customerId || lineRows.length === 0) {
      setError('Please select a customer order, customer, and add at least one line.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CreateInvoiceInput = {
        salesOrderId: selectedOrderId,
        customerId,
        invoiceType,
        status,
        issueDate: issueDate || undefined,
        dueDate: dueDate || undefined,
        billingStreet: billingAddress || undefined,
        notes: notes || undefined,
        lines: lineRows.map((row) => ({
          salesOrderLineId: row.salesOrderLineId,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
        })),
      };
      const created = await createInvoice(payload);
      router.replace(`/invoices/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create invoice.');
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
        Create Invoice
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          component={Link}
          href="/invoices"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back
        </Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
      {error ? (
        <Typography color="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 640 }}>
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
        <FormControl fullWidth>
          <InputLabel>Customer</InputLabel>
          <Select
            value={customerId}
            label="Customer"
            onChange={(e) => setCustomerId(e.target.value as number | '')}
          >
            <MenuItem value="">
              <em>Select customer</em>
            </MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.code ? `${c.code} ` : ''}{c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={invoiceType}
            label="Type"
            onChange={(e) =>
              setInvoiceType(e.target.value as 'quotation' | 'invoice' | 'proforma_invoice')
            }
          >
            <MenuItem value="quotation">Quotation</MenuItem>
            <MenuItem value="invoice">Invoice</MenuItem>
            <MenuItem value="proforma_invoice">Proforma Invoice</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) =>
              setStatus(e.target.value as 'unpaid' | 'paid' | 'dummy')
            }
          >
            <MenuItem value="unpaid">Unpaid</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="dummy">Dummy</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Created"
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Billing Address"
          multiline
          rows={3}
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
        />
        <TextField
          label="Notes"
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Box>
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
        Line items
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Product Group</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell>UoM</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell>Delivery Date</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {lineRows.map((row, index) => (
              <TableRow key={row.salesOrderLineId}>
                <TableCell>-</TableCell>
                <TableCell>{row.itemGroup ?? '-'}</TableCell>
                <TableCell>
                  {row.itemCode ? `${row.itemCode} ` : ''}
                  {row.itemName ?? '-'}
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={row.quantity}
                    onChange={(e) =>
                      updateLineQuantity(index, Number(e.target.value) || 0)
                    }
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={row.unitPrice}
                    onChange={(e) =>
                      updateLinePrice(index, Number(e.target.value) || 0)
                    }
                    sx={{ width: 100 }}
                  />
                </TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell align="right">{formatCurrency(row.lineTotal)}</TableCell>
                <TableCell>
                  {row.deliveryDate
                    ? new Date(row.deliveryDate).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeLine(index)}
                    startIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {lineRows.length === 0 && selectedOrderId ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No lines in this order. Select another customer order.
        </Typography>
      ) : null}
    </Box>
  );
}
