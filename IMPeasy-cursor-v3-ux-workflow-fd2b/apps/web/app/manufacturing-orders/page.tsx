'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { PageShell } from '../../components/ui/page-templates';
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
} from '../../components/ui/primitives';
import { listManufacturingOrders } from '../../lib/api';
import {
  bookingCompletenessTone,
  formatProductionDate,
  manufacturingOrderStatusTone,
  normalizeProductionStatus,
  releaseStateTone,
} from '../../lib/production';
import type { ManufacturingOrder } from '../../types/manufacturing-order';

export default function ManufacturingOrdersPage(): JSX.Element {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [workstationFilter, setWorkstationFilter] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setOrders(await listManufacturingOrders());
      } catch {
        setError('Unable to load manufacturing orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading manufacturing orders...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  const statusOptions = Array.from(new Set(orders.map((order) => order.status))).sort();
  const workstationOptions = Array.from(
    new Set(
      orders
        .map((order) => order.currentWorkstation ?? order.assignedWorkstation)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();
  const operatorOptions = Array.from(
    new Set(
      orders
        .map((order) => order.assignedOperatorName)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  const filteredOrders = orders.filter((order) => {
    const normalizedItem = `${order.itemCode} ${order.itemName}`.toLowerCase();
    const normalizedCustomer = `${order.customerName} ${order.salesOrderNumber}`.toLowerCase();
    const workstation = (order.currentWorkstation ?? order.assignedWorkstation ?? '').toLowerCase();
    const operator = (order.assignedOperatorName ?? '').toLowerCase();

    if (statusFilter && order.status !== statusFilter) {
      return false;
    }

    if (dueDateFilter && (order.dueDate?.slice(0, 10) ?? '') !== dueDateFilter) {
      return false;
    }

    if (itemFilter && !normalizedItem.includes(itemFilter.toLowerCase())) {
      return false;
    }

    if (customerFilter && !normalizedCustomer.includes(customerFilter.toLowerCase())) {
      return false;
    }

    if (workstationFilter && workstation !== workstationFilter.toLowerCase()) {
      return false;
    }

    if (operatorFilter && operator !== operatorFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  const plannedCount = orders.filter((order) => order.status === 'planned').length;
  const releasedCount = orders.filter((order) => order.status === 'released').length;
  const inProgressCount = orders.filter((order) => order.status === 'in_progress').length;
  const completedCount = orders.filter((order) => order.status === 'completed').length;

  return (
    <PageShell
      eyebrow="Production"
      title="Manufacturing orders"
      description="Planner landing page for the lean MVP: dense list, practical filters, quick-open links, and immediate visibility into booking completeness and current operation."
      actions={
        <>
          <ButtonLink href="/production/calendar">Production calendar</ButtonLink>
          <ButtonLink href="/dashboards/production">Dashboard</ButtonLink>
        </>
      }
    >
      <StatGrid>
        <StatCard label="Total" value={orders.length} />
        <StatCard label="Planned" value={plannedCount} />
        <StatCard label="Released" value={releasedCount} />
        <StatCard label="In Progress" value={inProgressCount} />
        <StatCard label="Completed" value={completedCount} />
      </StatGrid>

      <div className="split-grid">
        <Panel
          title="Planner queue"
          description="Filters stay close to the list so planners can narrow by due date, customer, workstation, or operator without losing row context."
        >
          <Toolbar>
            <ToolbarGroup>
              <Badge tone="info">{filteredOrders.length} visible</Badge>
              <span className="muted-copy">
                One sales-order line drives one Manufacturing Order in the active MVP.
              </span>
            </ToolbarGroup>
            <ToolbarGroup>
              <ButtonLink href="/customer-orders">Customer orders</ButtonLink>
            </ToolbarGroup>
          </Toolbar>

          <FormGrid columns={2}>
            <Field label="Status">
              <select
                className="control"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {normalizeProductionStatus(status)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due Date">
              <input
                className="control"
                type="date"
                value={dueDateFilter}
                onChange={(event) => setDueDateFilter(event.target.value)}
              />
            </Field>
            <Field label="Item">
              <input
                className="control"
                value={itemFilter}
                onChange={(event) => setItemFilter(event.target.value)}
                placeholder="Code or item name"
              />
            </Field>
            <Field label="Customer">
              <input
                className="control"
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
                placeholder="Customer or sales order"
              />
            </Field>
            <Field label="Workstation">
              <select
                className="control"
                value={workstationFilter}
                onChange={(event) => setWorkstationFilter(event.target.value)}
              >
                <option value="">All workstations</option>
                {workstationOptions.map((workstation) => (
                  <option key={workstation} value={workstation}>
                    {workstation}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assigned Operator">
              <select
                className="control"
                value={operatorFilter}
                onChange={(event) => setOperatorFilter(event.target.value)}
              >
                <option value="">All operators</option>
                {operatorOptions.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
            </Field>
          </FormGrid>

          <DataTable
            columns={[
              {
                header: 'MO Number',
                width: '110px',
                cell: (order) => (
                  <Link href={`/manufacturing-orders/${order.id}`} className="mono">
                    {order.documentNumber}
                  </Link>
                ),
              },
              {
                header: 'Source Sales Line',
                cell: (order) => (
                  <div className="stack stack--tight">
                    <strong>{order.salesOrderNumber}</strong>
                    <span className="muted-copy--small">Line #{order.salesOrderLineId}</span>
                  </div>
                ),
              },
              {
                header: 'Item',
                cell: (order) => (
                  <div className="stack stack--tight">
                    <strong>{order.itemName}</strong>
                    <span className="muted-copy--small mono">{order.itemCode}</span>
                  </div>
                ),
              },
              {
                header: 'Quantity',
                width: '90px',
                align: 'right',
                cell: (order) => <span className="mono">{order.quantity}</span>,
              },
              {
                header: 'Due Date',
                width: '118px',
                cell: (order) => <span className="mono">{formatProductionDate(order.dueDate)}</span>,
              },
              {
                header: 'Status',
                width: '118px',
                cell: (order) => (
                  <Badge tone={manufacturingOrderStatusTone(order.status)}>
                    {normalizeProductionStatus(order.status)}
                  </Badge>
                ),
              },
              {
                header: 'Release',
                width: '104px',
                cell: (order) => (
                  <Badge tone={releaseStateTone(order.releaseState)}>
                    {normalizeProductionStatus(order.releaseState)}
                  </Badge>
                ),
              },
              {
                header: 'Current Operation',
                cell: (order) => (
                  <div className="stack stack--tight">
                    <strong>{order.currentOperationName ?? 'Completed'}</strong>
                    <span className="muted-copy--small">
                      {order.currentWorkstation ?? order.assignedWorkstation ?? '-'}
                    </span>
                  </div>
                ),
              },
              {
                header: 'Assigned Operator',
                cell: (order) => order.assignedOperatorName ?? '-',
              },
              {
                header: 'Booking',
                width: '110px',
                cell: (order) => (
                  <Badge tone={bookingCompletenessTone(order.bookingCompletenessPercent)}>
                    {order.bookingCompletenessPercent}%
                  </Badge>
                ),
              },
            ]}
            rows={filteredOrders}
            getRowKey={(order) => String(order.id)}
            emptyState={
              <EmptyState
                title="No Manufacturing Orders match the filters"
                description="Clear one or more filters or create Manufacturing Orders from released sales orders in the customer-order workspace."
              />
            }
          />
        </Panel>

        <div className="page-stack">
          <Panel
            title="Planner reminders"
            description="This slice stays visibility-first: open the Manufacturing Order detail for booking, release, and assignment."
          >
            <ul className="page-stack">
              <li>Release stays manual and is blocked until component bookings are complete.</li>
              <li>The first operation turns ready only after release.</li>
              <li>The kiosk handles execution; the planner page handles preparation and traceability.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
