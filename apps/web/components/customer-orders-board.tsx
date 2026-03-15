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
  StatCard,
  StatGrid,
  Toolbar,
  ToolbarGroup,
} from './ui/primitives';

type CustomerOrderBoardRow = {
  kind: 'quote' | 'sales-order';
  id: number;
  documentNumber: string;
  status: string;
  customer: string;
  salesperson: string;
  documentDate: string;
  promisedDate: string | null;
  totalAmount: number;
  productionStatus: string;
  shipmentStatus: string;
  invoiceStatus: string;
  updatedAt: string;
};

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

export function CustomerOrdersBoard(): JSX.Element {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [promisedDate, setPromisedDate] = useState('');
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
  }, [rows, statusFilter, customerFilter, salespersonFilter, dateFrom, dateTo, promisedDate]);

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
      description="Operational view across quotes and sales orders with dense filtering, downstream status cues, and fast access into the unified commercial workspace."
      actions={
        <>
          <ButtonLink href="/customers">Customers</ButtonLink>
          <ButtonLink href="/customer-orders/new" tone="primary">
            New Quote
          </ButtonLink>
        </>
      }
    >
      <StatGrid>
        <StatCard
          label="Draft Quotes"
          value={rows.filter((row) => row.kind === 'quote' && row.status === 'draft').length}
          hint="Still being prepared for customer send."
        />
        <StatCard
          label="Approved Quotes"
          value={rows.filter((row) => row.kind === 'quote' && row.status === 'approved').length}
          hint="Ready for quote-to-order conversion."
        />
        <StatCard
          label="Open Orders"
          value={
            rows.filter(
              (row) =>
                row.kind === 'sales-order' &&
                !['shipped', 'invoiced', 'closed'].includes(row.status),
            ).length
          }
          hint="Sales orders still active in the workflow."
        />
        <StatCard
          label="Released Orders"
          value={rows.filter((row) => row.kind === 'sales-order' && row.status === 'released').length}
          hint="Ready for the production slice to take over."
        />
        <StatCard
          label="Board Value"
          value={formatCurrency(rows.reduce((sum, row) => sum + row.totalAmount, 0))}
          hint="Gross commercial value of visible documents."
        />
        <StatCard
          label="Visible Rows"
          value={filteredRows.length}
          hint="Current result count after filters."
        />
      </StatGrid>

      <Panel title="Filters" description="Limit the board by document status, commercial owner, and customer date commitments.">
        <FormGrid columns={2}>
          <Field label="Status">
            <select className="control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Customer">
            <select className="control" value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}>
              <option value="all">All customers</option>
              {customerOptions.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Salesperson">
            <select className="control" value={salespersonFilter} onChange={(event) => setSalespersonFilter(event.target.value)}>
              <option value="all">All salespeople</option>
              {salespersonOptions.map((salesperson) => (
                <option key={salesperson} value={salesperson}>
                  {salesperson}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Promised Date">
            <input className="control" type="date" value={promisedDate} onChange={(event) => setPromisedDate(event.target.value)} />
          </Field>
          <Field label="Date From">
            <input className="control" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </Field>
          <Field label="Date To">
            <input className="control" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </Field>
        </FormGrid>
      </Panel>

      <Panel title="Documents" description="Quotes and sales orders share one dense board so office users can read the current state without leaving the module.">
        <Toolbar>
          <ToolbarGroup>
            <Badge tone="info">{filteredRows.length} visible</Badge>
            <span className="muted-copy">Rows sort by promised date first and last update second.</span>
          </ToolbarGroup>
          <ToolbarGroup>
            <ButtonLink href="/dashboards/customer-orders">Open dashboard</ButtonLink>
          </ToolbarGroup>
        </Toolbar>
        <DataTable
          caption="Commercial board rows stay dense and operational. Open any row to continue work in the customer-order workspace."
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
                  <strong>{row.customer}</strong>
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
              header: 'Production',
              width: '150px',
              cell: (row) => <Badge tone={getStatusTone(row.productionStatus)}>{row.productionStatus}</Badge>,
            },
            {
              header: 'Shipment',
              width: '150px',
              cell: (row) => <Badge tone={getStatusTone(row.shipmentStatus)}>{row.shipmentStatus}</Badge>,
            },
            {
              header: 'Invoice',
              width: '150px',
              cell: (row) => <Badge tone={getStatusTone(row.invoiceStatus)}>{row.invoiceStatus}</Badge>,
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
              description="Adjust one of the filters above or create a new quote to start the commercial flow."
              action={<ButtonLink href="/customer-orders/new" tone="primary">New Quote</ButtonLink>}
            />
          }
        />
      </Panel>
    </PageShell>
  );
}
