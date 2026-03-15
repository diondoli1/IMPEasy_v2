'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { PageShell } from '../../../components/ui/page-templates';
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  FormGrid,
  Notice,
  Panel,
  Toolbar,
  ToolbarGroup,
} from '../../../components/ui/primitives';
import { listAuthUsers, listManufacturingOrders, updateManufacturingOrder } from '../../../lib/api';
import {
  addDays,
  formatProductionDate,
  manufacturingOrderStatusTone,
  normalizeProductionStatus,
  startOfWeek,
  toDateInputValue,
  toIsoDate,
} from '../../../lib/production';
import type { AuthUser } from '../../../types/auth';
import type { ManufacturingOrder } from '../../../types/manufacturing-order';

type CalendarDraftState = Record<
  number,
  {
    dueDate: string;
    assignedOperatorId: string;
    assignedWorkstation: string;
  }
>;

function createDrafts(orders: ManufacturingOrder[]): CalendarDraftState {
  return orders.reduce<CalendarDraftState>((accumulator, order) => {
    accumulator[order.id] = {
      dueDate: toDateInputValue(order.dueDate),
      assignedOperatorId: order.assignedOperatorId ? String(order.assignedOperatorId) : '',
      assignedWorkstation: order.assignedWorkstation ?? '',
    };
    return accumulator;
  }, {});
}

export default function ProductionCalendarPage(): JSX.Element {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [drafts, setDrafts] = useState<CalendarDraftState>({});
  const [weekStartIso, setWeekStartIso] = useState(() => toIsoDate(startOfWeek(new Date())));
  const [workstationFilter, setWorkstationFilter] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [orderData, userData] = await Promise.all([
          listManufacturingOrders(),
          listAuthUsers(),
        ]);
        setOrders(orderData);
        setUsers(userData.filter((user) => user.isActive));
        setDrafts(createDrafts(orderData));
      } catch {
        setError('Unable to load the production calendar.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading production calendar...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  const weekStart = new Date(`${weekStartIso}T00:00:00`);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      isoDate: toIsoDate(date),
      label: date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }),
    };
  });

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
    const dueDate = order.dueDate?.slice(0, 10);
    const workstation = (order.currentWorkstation ?? order.assignedWorkstation ?? '').toLowerCase();
    const operator = (order.assignedOperatorName ?? '').toLowerCase();

    if (!dueDate || dueDate < days[0].isoDate || dueDate > days[6].isoDate) {
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

  return (
    <PageShell
      eyebrow="Production"
      title="Production calendar"
      description="Weekly, visibility-first planner for Manufacturing Orders. The calendar shows due-date placement and allows only small due-date and assignment edits."
      actions={
        <>
          <ButtonLink href="/manufacturing-orders">Manufacturing orders</ButtonLink>
          <ButtonLink href="/dashboards/production">Dashboard</ButtonLink>
        </>
      }
    >
      <Panel
        title="Week controls"
        description="There is no drag-and-drop or capacity engine in the active MVP. Use the week switcher and small inline saves instead."
      >
        <Toolbar>
          <ToolbarGroup>
            <Button
              onClick={() => {
                const previousWeek = addDays(weekStart, -7);
                setWeekStartIso(toIsoDate(previousWeek));
              }}
            >
              Previous week
            </Button>
            <Button
              onClick={() => {
                setWeekStartIso(toIsoDate(startOfWeek(new Date())));
              }}
            >
              Current week
            </Button>
            <Button
              onClick={() => {
                const nextWeek = addDays(weekStart, 7);
                setWeekStartIso(toIsoDate(nextWeek));
              }}
            >
              Next week
            </Button>
          </ToolbarGroup>
          <ToolbarGroup>
            <Badge tone="info">{filteredOrders.length} visible orders</Badge>
            <span className="muted-copy">
              Week of {formatProductionDate(`${days[0].isoDate}T00:00:00`)} to{' '}
              {formatProductionDate(`${days[6].isoDate}T00:00:00`)}
            </span>
          </ToolbarGroup>
        </Toolbar>

        {message ? <Notice title="Saved">{message}</Notice> : null}
        {actionError ? <Notice title="Save failed" tone="warning">{actionError}</Notice> : null}

        <FormGrid columns={2}>
          <Field label="Workstation Filter">
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
          <Field label="Operator Filter">
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
      </Panel>

      <div className="calendar-grid">
        {days.map((day) => {
          const dayOrders = filteredOrders.filter((order) => order.dueDate?.slice(0, 10) === day.isoDate);

          return (
            <Panel
              key={day.isoDate}
              title={day.label}
              description={`${dayOrders.length} Manufacturing Order${dayOrders.length === 1 ? '' : 's'}`}
            >
              {dayOrders.length === 0 ? (
                <EmptyState
                  title="No due orders"
                  description="This day has no Manufacturing Orders after the current filters are applied."
                />
              ) : (
                <div className="page-stack">
                  {dayOrders.map((order) => {
                    const draft = drafts[order.id] ?? {
                      dueDate: toDateInputValue(order.dueDate),
                      assignedOperatorId: order.assignedOperatorId ? String(order.assignedOperatorId) : '',
                      assignedWorkstation: order.assignedWorkstation ?? '',
                    };

                    return (
                      <div key={order.id} className="calendar-card">
                        <div className="calendar-card__header">
                          <div className="stack stack--tight">
                            <Link href={`/manufacturing-orders/${order.id}`} className="mono">
                              {order.documentNumber}
                            </Link>
                            <strong>{order.itemName}</strong>
                            <span className="muted-copy--small">{order.customerName}</span>
                          </div>
                          <Badge tone={manufacturingOrderStatusTone(order.status)}>
                            {normalizeProductionStatus(order.status)}
                          </Badge>
                        </div>
                        <div className="calendar-card__meta">
                          <span>Current: {order.currentOperationName ?? 'Completed'}</span>
                          <span>Workstation: {order.currentWorkstation ?? order.assignedWorkstation ?? '-'}</span>
                          <span>Operator: {order.assignedOperatorName ?? 'Unassigned'}</span>
                        </div>
                        <div className="calendar-card__form">
                          <Field label="Due Date">
                            <input
                              className="control control--dense"
                              type="date"
                              value={draft.dueDate}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [order.id]: {
                                    ...draft,
                                    dueDate: event.target.value,
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="Operator">
                            <select
                              className="control control--dense"
                              value={draft.assignedOperatorId}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [order.id]: {
                                    ...draft,
                                    assignedOperatorId: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">Unassigned</option>
                              {users.map((user) => (
                                <option key={user.id} value={String(user.id)}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Workstation">
                            <input
                              className="control control--dense"
                              value={draft.assignedWorkstation}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [order.id]: {
                                    ...draft,
                                    assignedWorkstation: event.target.value,
                                  },
                                }))
                              }
                            />
                          </Field>
                          <div>
                            <Button
                              disabled={savingOrderId === order.id}
                              onClick={() => {
                                void (async () => {
                                  setSavingOrderId(order.id);
                                  setActionError(null);
                                  setMessage(null);
                                  try {
                                    const updatedOrder = await updateManufacturingOrder(order.id, {
                                      dueDate: draft.dueDate || undefined,
                                      assignedOperatorId: draft.assignedOperatorId
                                        ? Number(draft.assignedOperatorId)
                                        : undefined,
                                      assignedWorkstation: draft.assignedWorkstation.trim() || undefined,
                                    });

                                    setOrders((current) =>
                                      current.map((currentOrder) =>
                                        currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder,
                                      ),
                                    );
                                    setDrafts((current) => ({
                                      ...current,
                                      [updatedOrder.id]: {
                                        dueDate: toDateInputValue(updatedOrder.dueDate),
                                        assignedOperatorId: updatedOrder.assignedOperatorId
                                          ? String(updatedOrder.assignedOperatorId)
                                          : '',
                                        assignedWorkstation: updatedOrder.assignedWorkstation ?? '',
                                      },
                                    }));
                                    setMessage(`Saved ${updatedOrder.documentNumber}.`);
                                  } catch {
                                    setActionError('Unable to save the production calendar update.');
                                  } finally {
                                    setSavingOrderId(null);
                                  }
                                })();
                              }}
                            >
                              {savingOrderId === order.id ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </PageShell>
  );
}
