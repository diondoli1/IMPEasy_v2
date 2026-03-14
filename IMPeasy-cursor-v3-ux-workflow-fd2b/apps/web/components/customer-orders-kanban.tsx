'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

import { listQuotes, listSalesOrders } from '../lib/api';
import { formatCurrency, formatDate, workspaceIdForDocument } from '../lib/commercial';
import type { Quote } from '../types/quote';
import type { SalesOrder } from '../types/sales-order';

const KANBAN_COLUMNS = [
  { key: 'quotation', label: 'Quotation' },
  { key: 'waiting_confirmation', label: 'Waiting for confirmation' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'waiting_production', label: 'Waiting for Production' },
  { key: 'in_production', label: 'In production' },
  { key: 'ready_shipment', label: 'Ready for shipment' },
] as const;

type ColumnKey = (typeof KANBAN_COLUMNS)[number]['key'];

type KanbanItem = {
  kind: 'quote' | 'sales-order';
  id: number;
  documentNumber: string;
  customer: string;
  totalAmount: number;
  promisedDate: string | null;
  column: ColumnKey;
};

function getQuoteColumn(quote: Quote): ColumnKey {
  if (quote.status === 'draft') return 'quotation';
  if (quote.status === 'approved' || quote.status === 'sent') return 'waiting_confirmation';
  return 'quotation';
}

function getSalesOrderColumn(so: SalesOrder): ColumnKey {
  if (so.status === 'draft' || so.status === 'confirmed') return 'confirmed';
  if (so.status === 'released') return 'waiting_production';
  if (so.status === 'in_production') return 'in_production';
  if (['shipped', 'invoiced', 'closed'].includes(so.status)) return 'ready_shipment';
  return 'confirmed';
}

const MAX_ITEMS_PER_COLUMN = 6;

export function CustomerOrdersKanban(): JSX.Element {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadData = useCallback(async () => {
    try {
      const [q, so] = await Promise.all([listQuotes(), listSalesOrders()]);
      setQuotes(q);
      setSalesOrders(so);
    } catch {
      setError('Unable to load customer orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const itemsByColumn = React.useMemo(() => {
    const items: KanbanItem[] = [];
    quotes.forEach((q) => {
      items.push({
        kind: 'quote',
        id: q.id,
        documentNumber: q.documentNumber,
        customer: q.customerName,
        totalAmount: q.totalAmount,
        promisedDate: q.promisedDate,
        column: getQuoteColumn(q),
      });
    });
    salesOrders.forEach((so) => {
      items.push({
        kind: 'sales-order',
        id: so.id,
        documentNumber: so.documentNumber,
        customer: so.customerName,
        totalAmount: so.totalAmount,
        promisedDate: so.promisedDate,
        column: getSalesOrderColumn(so),
      });
    });
    items.sort((a, b) => (b.promisedDate ?? '').localeCompare(a.promisedDate ?? ''));
    const byCol: Record<ColumnKey, KanbanItem[]> = {
      quotation: [],
      waiting_confirmation: [],
      confirmed: [],
      waiting_production: [],
      in_production: [],
      ready_shipment: [],
    };
    items.forEach((item) => {
      byCol[item.column].push(item);
    });
    KANBAN_COLUMNS.forEach((col) => {
      byCol[col.key] = byCol[col.key].slice(0, MAX_ITEMS_PER_COLUMN);
    });
    return byCol;
  }, [quotes, salesOrders]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading customer orders...</Typography>
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
        <Typography variant="h6">Customer Orders</Typography>
        <Button
          component={Link}
          href="/customer-orders/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          +Create
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: 320,
        }}
      >
        {KANBAN_COLUMNS.map((col) => (
          <Card
            key={col.key}
            sx={{
              minWidth: 220,
              maxWidth: 220,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                {col.label}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {itemsByColumn[col.key].map((item) => (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={`/customer-orders/${workspaceIdForDocument(item.kind, item.id)}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Card variant="outlined" sx={{ p: 1.5, '&:hover': { bgcolor: 'action.hover' } }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {item.documentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {item.customer}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {formatCurrency(item.totalAmount)}
                      </Typography>
                      {item.promisedDate && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.promisedDate)}
                        </Typography>
                      )}
                    </Card>
                  </Link>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
