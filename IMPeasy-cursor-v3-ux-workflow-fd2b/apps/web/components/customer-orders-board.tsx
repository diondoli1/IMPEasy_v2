'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { listQuotes, listSalesOrders } from '../lib/api';
import { formatCurrency, formatDate, workspaceIdForDocument } from '../lib/commercial';
import type { Quote } from '../types/quote';
import type { SalesOrder } from '../types/sales-order';
import { PageShell } from './ui/page-templates';
import {
  Badge,
  ButtonLink,
  DataTable,
  EmptyState,
  Field,
  FormGrid,
  Panel,
} from './ui/primitives';

type CustomerOrderBoardRow = {
  kind: 'quote' | 'sales-order';
  id: number;
  documentNumber: string;
  status: string;
  customer: string;
  customerCode: string | null;
  salesperson: string;
  documentDate: string;
  promisedDate: string | null;
  totalAmount: number;
  productionStatus: string;
  shipmentStatus: string;
  invoiceStatus: string;
  updatedAt: string;
};

type KanbanColumnId =
  | 'quotation'
  | 'waiting_confirmation'
  | 'confirmed'
  | 'waiting_production'
  | 'in_production'
  | 'ready_for_shipment';

const KANBAN_COLUMNS: Array<{
  id: KanbanColumnId;
  label: string;
  matches: (row: CustomerOrderBoardRow) => boolean;
}> = [
  {
    id: 'quotation',
    label: 'Quotation',
    matches: (row) =>
      row.kind === 'quote' && row.status === 'draft',
  },
  {
    id: 'waiting_confirmation',
    label: 'Waiting for confirmation',
    matches: (row) =>
      (row.kind === 'quote' && ['sent'].includes(row.status)) ||
      (row.kind === 'sales-order' && row.status === 'draft'),
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    matches: (row) =>
      (row.kind === 'quote' && row.status === 'approved') ||
      (row.kind === 'sales-order' && row.status === 'confirmed'),
  },
  {
    id: 'waiting_production',
    label: 'Waiting for production',
    matches: (row) =>
      row.kind === 'sales-order' && row.status === 'released',
  },
  {
    id: 'in_production',
    label: 'In production',
    matches: (row) =>
      row.kind === 'sales-order' && row.status === 'in_production',
  },
  {
    id: 'ready_for_shipment',
    label: 'Ready for shipment',
    matches: (row) =>
      row.kind === 'sales-order' &&
      ['shipped', 'invoiced', 'closed'].includes(row.status),
  },
];

function getQuoteDownstreamStatus(quote: Quote): Pick<
  CustomerOrderBoardRow,
  'productionStatus' | 'shipmentStatus' | 'invoiceStatus'
> {
  if (quote.linkedSalesOrderId) {
    return {
      productionStatus: 'sales order created',
      shipmentStatus: 'not ready',
      invoiceStatus: 'not ready',
    };
  }

  return {
    productionStatus: 'quote stage',
    shipmentStatus: 'quote stage',
    invoiceStatus: 'quote stage',
  };
}

function getSalesOrderDownstreamStatus(salesOrder: SalesOrder): Pick<
  CustomerOrderBoardRow,
  'productionStatus' | 'shipmentStatus' | 'invoiceStatus'
> {
  if (salesOrder.status === 'draft') {
    return {
      productionStatus: 'not released',
      shipmentStatus: 'not ready',
      invoiceStatus: 'not ready',
    };
  }

  if (salesOrder.status === 'confirmed') {
    return {
      productionStatus: 'waiting release',
      shipmentStatus: 'not ready',
      invoiceStatus: 'not ready',
    };
  }

  if (salesOrder.status === 'released') {
    return {
      productionStatus: 'waiting MO',
      shipmentStatus: 'not ready',
      invoiceStatus: 'not ready',
    };
  }

  if (salesOrder.status === 'in_production') {
    return {
      productionStatus: 'in production',
      shipmentStatus: 'waiting shipment',
      invoiceStatus: 'not ready',
    };
  }

  if (salesOrder.status === 'shipped') {
    return {
      productionStatus: 'completed',
      shipmentStatus: 'shipped',
      invoiceStatus: 'pending invoice',
    };
  }

  return {
    productionStatus: 'completed',
    shipmentStatus: 'shipped',
    invoiceStatus: 'invoiced',
  };
}

function getStatusTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (
    status.includes('waiting') ||
    status.includes('not ready') ||
    status.includes('quote stage')
  ) {
    return 'warning';
  }

  if (status.includes('production') || status.includes('shipment')) {
    return 'info';
  }

  if (status.includes('completed') || status.includes('invoiced') || status.includes('shipped')) {
    return 'success';
  }

  if (status.includes('rejected')) {
    return 'danger';
  }

  return 'neutral';
}

function formatCustomerDisplay(customerCode: string | null, customerName: string): string {
  if (customerCode) {
    return `${customerCode} ${customerName}`;
  }
  return customerName;
}

function KanbanToolbarIcon({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  active?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      className={`kanban-toolbar__icon${active ? ' kanban-toolbar__icon--active' : ''}`}
      title={title}
      onClick={onClick}
      aria-label={title}
    >
      {children}
    </button>
  );
}

export function CustomerOrdersBoard(): JSX.Element {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [promisedDate, setPromisedDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [quoteData, salesOrderData] = await Promise.all([listQuotes(), listSalesOrders()]);
        setQuotes(quoteData);
        setSalesOrders(salesOrderData);
      } catch {
        setError('Unable to load the customer orders board.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = useMemo<CustomerOrderBoardRow[]>(() => {
    const quoteRows = quotes.map((quote) => ({
      kind: 'quote' as const,
      id: quote.id,
      documentNumber: quote.documentNumber,
      status: quote.status,
      customer: quote.customerName,
      customerCode: quote.customerCode,
      salesperson: quote.salespersonName ?? '-',
      documentDate: quote.quoteDate,
      promisedDate: quote.promisedDate,
      totalAmount: quote.totalAmount,
      updatedAt: quote.updatedAt,
      ...getQuoteDownstreamStatus(quote),
    }));
    const salesOrderRows = salesOrders.map((salesOrder) => ({
      kind: 'sales-order' as const,
      id: salesOrder.id,
      documentNumber: salesOrder.documentNumber,
      status: salesOrder.status,
      customer: salesOrder.customerName,
      customerCode: salesOrder.customerCode,
      salesperson: salesOrder.salespersonName ?? '-',
      documentDate: salesOrder.orderDate,
      promisedDate: salesOrder.promisedDate,
      totalAmount: salesOrder.totalAmount,
      updatedAt: salesOrder.updatedAt,
      ...getSalesOrderDownstreamStatus(salesOrder),
    }));

    return [...salesOrderRows, ...quoteRows].sort((left, right) => {
      const promisedLeft = left.promisedDate ?? left.updatedAt;
      const promisedRight = right.promisedDate ?? right.updatedAt;
      return promisedRight.localeCompare(promisedLeft);
    });
  }, [quotes, salesOrders]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          row.documentNumber.toLowerCase().includes(q) ||
          row.customer.toLowerCase().includes(q) ||
          (row.customerCode?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }

      if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false;
      }

      if (customerFilter !== 'all' && row.customer !== customerFilter) {
        return false;
      }

      if (salespersonFilter !== 'all' && row.salesperson !== salespersonFilter) {
        return false;
      }

      if (dateFrom && row.documentDate.slice(0, 10) < dateFrom) {
        return false;
      }

      if (dateTo && row.documentDate.slice(0, 10) > dateTo) {
        return false;
      }

      if (promisedDate && (row.promisedDate?.slice(0, 10) ?? '') !== promisedDate) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    searchQuery,
    statusFilter,
    customerFilter,
    salespersonFilter,
    dateFrom,
    dateTo,
    promisedDate,
  ]);

  const rowsByColumn = useMemo(() => {
    const map = new Map<KanbanColumnId, CustomerOrderBoardRow[]>();
    for (const col of KANBAN_COLUMNS) {
      map.set(col.id, []);
    }
    for (const row of filteredRows) {
      const col = KANBAN_COLUMNS.find((c) => c.matches(row));
      if (col) {
        map.get(col.id)!.push(row);
      }
    }
    return map;
  }, [filteredRows]);

  const columnTotals = useMemo(() => {
    const totals = new Map<KanbanColumnId, number>();
    for (const col of KANBAN_COLUMNS) {
      const colRows = rowsByColumn.get(col.id) ?? [];
      totals.set(col.id, colRows.reduce((sum, r) => sum + r.totalAmount, 0));
    }
    return totals;
  }, [rowsByColumn]);

  const customerOptions = Array.from(new Set(rows.map((row) => row.customer))).sort();
  const salespersonOptions = Array.from(new Set(rows.map((row) => row.salesperson))).sort();
  const statusOptions = Array.from(new Set(rows.map((row) => row.status))).sort();

  if (loading) {
    return <p>Loading customer orders board...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <PageShell
      eyebrow="Customer Orders"
      title="Customer orders board"
      description="Kanban view across quotes and sales orders with status columns, totals per column, and fast access into the unified commercial workspace."
      actions={
        <>
          <ButtonLink href="/customers">Customers</ButtonLink>
          <ButtonLink href="/customer-orders/new" tone="primary">
            New Quote
          </ButtonLink>
        </>
      }
    >
      <Panel
        title="Board"
        description="MRPeasy-style Kanban layout with status columns and order cards. Switch to table view for dense data."
      >
        <div className="kanban-toolbar">
          <div className="kanban-toolbar__group">
            <div className="kanban-toolbar__search">
              <svg
                className="kanban-toolbar__search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                className="kanban-toolbar__search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search orders"
              />
            </div>
            <Link
              href="/customer-orders/new"
              className="kanban-toolbar__icon"
              title="Add"
              aria-label="Add"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
            <KanbanToolbarIcon
              title="List view"
              onClick={() => setViewMode('table')}
              active={viewMode === 'table'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </KanbanToolbarIcon>
            <KanbanToolbarIcon
              title="Kanban view"
              onClick={() => setViewMode('kanban')}
              active={viewMode === 'kanban'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="6" height="18" rx="1" />
                <rect x="10" y="3" width="6" height="18" rx="1" />
                <rect x="17" y="3" width="6" height="18" rx="1" />
              </svg>
            </KanbanToolbarIcon>
            <KanbanToolbarIcon
              title="Filter"
              onClick={() => setShowFilters((f) => !f)}
              active={showFilters}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </KanbanToolbarIcon>
            <KanbanToolbarIcon title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </KanbanToolbarIcon>
          </div>
          <div className="kanban-toolbar__group">
            <Badge tone="info">{filteredRows.length} visible</Badge>
          </div>
        </div>

        {showFilters ? (
          <div className="kanban-filters">
            <FormGrid columns={2}>
              <Field label="Status">
                <select
                  className="control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Customer">
                <select
                  className="control"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                >
                  <option value="all">All customers</option>
                  {customerOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Salesperson">
                <select
                  className="control"
                  value={salespersonFilter}
                  onChange={(e) => setSalespersonFilter(e.target.value)}
                >
                  <option value="all">All salespeople</option>
                  {salespersonOptions.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Promised Date">
                <input
                  className="control"
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                />
              </Field>
              <Field label="Date From">
                <input
                  className="control"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Field>
              <Field label="Date To">
                <input
                  className="control"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Field>
            </FormGrid>
          </div>
        ) : null}

        {viewMode === 'kanban' ? (
          <div className="kanban-board">
            {KANBAN_COLUMNS.map((col) => {
              const colRows = rowsByColumn.get(col.id) ?? [];
              const total = columnTotals.get(col.id) ?? 0;
              return (
                <div key={col.id} className="kanban-column">
                  <div className="kanban-column__header">
                    <span className="kanban-column__title">{col.label}</span>
                    <span className="kanban-column__total">{formatCurrency(total)}</span>
                  </div>
                  <div className="kanban-column__cards">
                    {colRows.map((row) => {
                      const key = `${row.kind}-${row.id}`;
                      const isSelected = selectedIds.has(key);
                      return (
                        <Link
                          key={key}
                          href={`/customer-orders/${workspaceIdForDocument(row.kind, row.id)}`}
                          className={`kanban-card${isSelected ? ' kanban-card--selected' : ''}`}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey) {
                              e.preventDefault();
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(key)) next.delete(key);
                                else next.add(key);
                                return next;
                              });
                            }
                          }}
                        >
                          <div className="kanban-card__id mono">{row.documentNumber}</div>
                          <div className="kanban-card__customer">
                            {formatCustomerDisplay(row.customerCode, row.customer)}
                          </div>
                          <div className="kanban-card__total mono">{formatCurrency(row.totalAmount)}</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <DataTable
            caption="Table view of quotes and sales orders."
            columns={[
              {
                header: 'Document',
                width: '170px',
                cell: (row) => (
                  <div className="stack stack--tight">
                    <strong className="mono">{row.documentNumber}</strong>
                    <span className="muted-copy--small">
                      {row.kind === 'quote' ? 'Quote' : 'Sales Order'}
                    </span>
                  </div>
                ),
              },
              {
                header: 'Customer',
                cell: (row) => (
                  <div className="stack stack--tight">
                    <strong>{formatCustomerDisplay(row.customerCode, row.customer)}</strong>
                    <span className="muted-copy--small">{row.salesperson}</span>
                  </div>
                ),
              },
              {
                header: 'Status',
                width: '140px',
                cell: (row) => <Badge tone={getStatusTone(row.status)}>{row.status}</Badge>,
              },
              {
                header: 'Promised',
                width: '120px',
                cell: (row) => <span className="mono">{formatDate(row.promisedDate)}</span>,
              },
              {
                header: 'Total',
                width: '130px',
                align: 'right',
                cell: (row) => <span className="mono">{formatCurrency(row.totalAmount)}</span>,
              },
              {
                header: 'Open',
                width: '110px',
                cell: (row) => (
                  <Link
                    className="button button--secondary"
                    href={`/customer-orders/${workspaceIdForDocument(row.kind, row.id)}`}
                  >
                    Workspace
                  </Link>
                ),
              },
            ]}
            rows={filteredRows}
            getRowKey={(row) => `${row.kind}-${row.id}`}
            emptyState={
              <EmptyState
                title="No documents match the current filters"
                description="Adjust filters or create a new quote to start the commercial flow."
                action={
                  <ButtonLink href="/customer-orders/new" tone="primary">
                    New Quote
                  </ButtonLink>
                }
              />
            }
          />
        )}
      </Panel>
    </PageShell>
  );
}
