'use client';

import React, { useEffect, useState } from 'react';

import {
  createOrUpdateMaterialBooking,
  getManufacturingOrder,
  listAuthUsers,
  releaseManufacturingOrder,
  updateManufacturingOrder,
  updateManufacturingOrderMaterialBooking,
  updateOperation,
} from '../lib/api';
import {
  bookingCompletenessTone,
  formatProductionDate,
  formatProductionDateTime,
  manufacturingOrderStatusTone,
  normalizeProductionStatus,
  operationStatusTone,
  releaseStateTone,
  toDateInputValue,
} from '../lib/production';
import type { AuthUser } from '../types/auth';
import type {
  ManufacturingOrderDetail,
  MaterialRequirement,
} from '../types/manufacturing-order';
import { PageShell } from './ui/page-templates';
import {
  Badge,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  Field,
  FormGrid,
  Notice,
  Panel,
  StatCard,
  StatGrid,
  Toolbar,
  ToolbarGroup,
} from './ui/primitives';

type ManufacturingOrderWorkspaceProps = {
  manufacturingOrderId: number;
};

type ManufacturingOrderTab = 'header' | 'materials' | 'operations' | 'output' | 'history';

type HeaderFormState = {
  dueDate: string;
  assignedOperatorId: string;
  assignedWorkstation: string;
  notes: string;
};

type MaterialEditorState = {
  bookingId: number | null;
  stockLotId: string;
  quantity: string;
};

type OperationAssignmentState = Record<number, string>;

const WORKSPACE_TABS: Array<{ value: ManufacturingOrderTab; label: string }> = [
  { value: 'header', label: 'Header' },
  { value: 'materials', label: 'Materials' },
  { value: 'operations', label: 'Operations' },
  { value: 'output', label: 'Output' },
  { value: 'history', label: 'History' },
];

function createHeaderState(order: ManufacturingOrderDetail): HeaderFormState {
  return {
    dueDate: toDateInputValue(order.dueDate),
    assignedOperatorId: order.assignedOperatorId ? String(order.assignedOperatorId) : '',
    assignedWorkstation: order.assignedWorkstation ?? '',
    notes: order.notes ?? '',
  };
}

function createMaterialEditor(material: MaterialRequirement): MaterialEditorState {
  const existingBooking = material.bookings[0] ?? null;
  const preferredLotId = existingBooking
    ? String(existingBooking.stockLotId)
    : material.availableLots[0]
      ? String(material.availableLots[0].id)
      : '';
  const remainingQuantity = Math.max(material.requiredQuantity - material.bookedQuantity, 1);

  return {
    bookingId: existingBooking?.id ?? null,
    stockLotId: preferredLotId,
    quantity: String(existingBooking?.quantity ?? remainingQuantity),
  };
}

function createMaterialEditors(order: ManufacturingOrderDetail): Record<number, MaterialEditorState> {
  return order.materials.reduce<Record<number, MaterialEditorState>>((accumulator, material) => {
    accumulator[material.bomItemId] = createMaterialEditor(material);
    return accumulator;
  }, {});
}

function createOperationAssignments(order: ManufacturingOrderDetail): OperationAssignmentState {
  return order.operations.reduce<OperationAssignmentState>((accumulator, operation) => {
    accumulator[operation.id] = operation.assignedOperatorId
      ? String(operation.assignedOperatorId)
      : '';
    return accumulator;
  }, {});
}

function getLotOptionLabels(material: MaterialRequirement): Array<{ id: string; label: string }> {
  const options = material.availableLots.map((lot) => ({
    id: String(lot.id),
    label: `${lot.lotNumber} (${lot.availableQuantity} available)`,
  }));

  for (const booking of material.bookings) {
    if (options.some((option) => option.id === String(booking.stockLotId))) {
      continue;
    }

    options.push({
      id: String(booking.stockLotId),
      label: `${booking.lotNumber} (existing booking)`,
    });
  }

  return options;
}

export function ManufacturingOrderWorkspace({
  manufacturingOrderId,
}: ManufacturingOrderWorkspaceProps): JSX.Element {
  const [order, setOrder] = useState<ManufacturingOrderDetail | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [activeTab, setActiveTab] = useState<ManufacturingOrderTab>('header');
  const [headerForm, setHeaderForm] = useState<HeaderFormState | null>(null);
  const [materialEditors, setMaterialEditors] = useState<Record<number, MaterialEditorState>>({});
  const [operationAssignments, setOperationAssignments] = useState<OperationAssignmentState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [savingMaterialId, setSavingMaterialId] = useState<number | null>(null);
  const [savingOperationId, setSavingOperationId] = useState<number | null>(null);

  async function loadWorkspace(): Promise<void> {
    const [orderData, userData] = await Promise.all([
      getManufacturingOrder(manufacturingOrderId),
      listAuthUsers(),
    ]);

    setOrder(orderData);
    setUsers(userData.filter((user) => user.isActive));
    setHeaderForm(createHeaderState(orderData));
    setMaterialEditors(createMaterialEditors(orderData));
    setOperationAssignments(createOperationAssignments(orderData));
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadWorkspace();
      } catch {
        setError('Unable to load the Manufacturing Order workspace.');
      } finally {
        setLoading(false);
      }
    })();
  }, [manufacturingOrderId]);

  if (loading) {
    return <p>Loading Manufacturing Order...</p>;
  }

  if (error || !order || !headerForm) {
    return (
      <div className="page-stack">
        <p role="alert">{error ?? 'Manufacturing Order not found.'}</p>
        <ButtonLink href="/manufacturing-orders">Back to Manufacturing Orders</ButtonLink>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Production"
      title={order.documentNumber}
      description="Main production control workspace for planning, booking, release, assignments, output, and execution history."
      actions={
        <>
          <Badge tone={manufacturingOrderStatusTone(order.status)}>
            {normalizeProductionStatus(order.status)}
          </Badge>
          <Badge tone={releaseStateTone(order.releaseState)}>
            {normalizeProductionStatus(order.releaseState)}
          </Badge>
          <ButtonLink href="/manufacturing-orders">Back to list</ButtonLink>
          <ButtonLink href={`/customer-orders/sales-order-${order.salesOrderId}`}>
            Source sales order
          </ButtonLink>
          <Button
            tone="primary"
            disabled={order.status !== 'planned' || releasing}
            onClick={() => {
              void (async () => {
                setReleasing(true);
                setWorkspaceError(null);
                setMessage(null);
                try {
                  const releasedOrder = await releaseManufacturingOrder(order.id);
                  setOrder(releasedOrder);
                  setHeaderForm(createHeaderState(releasedOrder));
                  setMaterialEditors(createMaterialEditors(releasedOrder));
                  setOperationAssignments(createOperationAssignments(releasedOrder));
                  setMessage('Manufacturing Order released.');
                } catch {
                  setWorkspaceError(
                    'Unable to release the Manufacturing Order. Confirm that all required materials are fully booked first.',
                  );
                } finally {
                  setReleasing(false);
                }
              })();
            }}
          >
            {releasing ? 'Releasing...' : 'Release MO'}
          </Button>
        </>
      }
    >
      <StatGrid>
        <StatCard
          label="Item"
          value={order.itemName}
          hint={<span className="mono">{order.itemCode}</span>}
        />
        <StatCard label="Customer" value={order.customerName} hint={order.salesOrderNumber} />
        <StatCard label="Booking" value={`${order.bookingCompletenessPercent}%`} />
        <StatCard
          label="Current Operation"
          value={order.currentOperationName ?? 'Completed'}
          hint={order.currentWorkstation ?? order.assignedWorkstation ?? '-'}
        />
        <StatCard label="Finished Lot" value={order.finishedGoodsLotNumber ?? 'Pending'} />
      </StatGrid>

      <Panel
        title="Manufacturing workspace"
        description="The lean MVP keeps one dense workspace for all planner actions: header edits, material booking, operation assignments, output review, and history."
      >
        <Toolbar>
          <ToolbarGroup>
            {WORKSPACE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`workspace-tab${activeTab === tab.value ? ' workspace-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </ToolbarGroup>
          <ToolbarGroup>
            <Badge tone={bookingCompletenessTone(order.bookingCompletenessPercent)}>
              {order.bookingCompletenessPercent}% booked
            </Badge>
            <span className="muted-copy">
              {order.itemCode} / Qty {order.quantity} / Due {formatProductionDate(order.dueDate)}
            </span>
          </ToolbarGroup>
        </Toolbar>

        {workspaceError ? <Notice title="Action failed" tone="warning">{workspaceError}</Notice> : null}
        {message ? <Notice title="Saved">{message}</Notice> : null}

        {activeTab === 'header' ? (
          <div className="split-grid">
            <Panel
              title="Header"
              description="Planner-facing header controls stay on one form: due date, workstation, operator, and notes."
            >
              <form
                className="page-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  void (async () => {
                    setSavingHeader(true);
                    setWorkspaceError(null);
                    setMessage(null);
                    try {
                      const updatedOrder = await updateManufacturingOrder(order.id, {
                        dueDate: headerForm.dueDate || undefined,
                        assignedOperatorId: headerForm.assignedOperatorId
                          ? Number(headerForm.assignedOperatorId)
                          : undefined,
                        assignedWorkstation: headerForm.assignedWorkstation.trim() || undefined,
                        notes: headerForm.notes.trim() || undefined,
                      });
                      setOrder(updatedOrder);
                      setHeaderForm(createHeaderState(updatedOrder));
                      setMaterialEditors(createMaterialEditors(updatedOrder));
                      setOperationAssignments(createOperationAssignments(updatedOrder));
                      setMessage('Manufacturing Order header saved.');
                    } catch {
                      setWorkspaceError('Unable to save the Manufacturing Order header.');
                    } finally {
                      setSavingHeader(false);
                    }
                  })();
                }}
              >
                <FormGrid columns={2}>
                  <Field label="MO Number">
                    <input className="control" value={order.documentNumber} readOnly />
                  </Field>
                  <Field label="Source Sales Line">
                    <input
                      className="control"
                      value={`${order.salesOrderNumber} / Line ${order.salesOrderLineId}`}
                      readOnly
                    />
                  </Field>
                  <Field label="Item">
                    <input className="control" value={`${order.itemCode} ${order.itemName}`} readOnly />
                  </Field>
                  <Field label="Quantity">
                    <input className="control" value={String(order.quantity)} readOnly />
                  </Field>
                  <Field label="BOM">
                    <input className="control" value={order.bomName ?? 'No BOM'} readOnly />
                  </Field>
                  <Field label="Routing">
                    <input className="control" value={order.routingName} readOnly />
                  </Field>
                  <Field label="Due Date">
                    <input
                      className="control"
                      type="date"
                      value={headerForm.dueDate}
                      onChange={(event) =>
                        setHeaderForm((current) =>
                          current
                            ? {
                                ...current,
                                dueDate: event.target.value,
                              }
                            : current,
                        )
                      }
                    />
                  </Field>
                  <Field label="Assigned Operator">
                    <select
                      className="control"
                      value={headerForm.assignedOperatorId}
                      onChange={(event) =>
                        setHeaderForm((current) =>
                          current
                            ? {
                                ...current,
                                assignedOperatorId: event.target.value,
                              }
                            : current,
                        )
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
                  <Field label="Assigned Workstation">
                    <input
                      className="control"
                      value={headerForm.assignedWorkstation}
                      onChange={(event) =>
                        setHeaderForm((current) =>
                          current
                            ? {
                                ...current,
                                assignedWorkstation: event.target.value,
                              }
                            : current,
                        )
                      }
                    />
                  </Field>
                  <Field label="Status">
                    <input className="control" value={normalizeProductionStatus(order.status)} readOnly />
                  </Field>
                </FormGrid>
                <Field label="Notes">
                  <textarea
                    className="control"
                    value={headerForm.notes}
                    onChange={(event) =>
                      setHeaderForm((current) =>
                        current
                          ? {
                              ...current,
                              notes: event.target.value,
                            }
                          : current,
                      )
                    }
                  />
                </Field>
                <div>
                  <Button type="submit" tone="primary" disabled={savingHeader}>
                    {savingHeader ? 'Saving...' : 'Save header'}
                  </Button>
                </div>
              </form>
            </Panel>

            <div className="page-stack">
              <Panel
                title="Header summary"
                description="The planner can change due date and assignment without leaving this workspace."
              >
                <DataTable
                  columns={[
                    { header: 'Field', width: '140px', cell: (row) => row.label },
                    { header: 'Value', cell: (row) => row.value },
                  ]}
                  rows={[
                    { id: 'created', label: 'Created', value: formatProductionDateTime(order.createdAt) },
                    { id: 'updated', label: 'Updated', value: formatProductionDateTime(order.updatedAt) },
                    { id: 'operator', label: 'Assigned Operator', value: order.assignedOperatorName ?? 'Unassigned' },
                    { id: 'workstation', label: 'Workstation', value: order.assignedWorkstation ?? 'Unassigned' },
                  ]}
                  getRowKey={(row) => row.id}
                />
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === 'materials' ? (
          <Panel
            title="Material booking"
            description="Release stays blocked until each required component quantity is fully booked from real lots."
          >
            {order.materials.length === 0 ? (
              <EmptyState
                title="No material requirements"
                description="This Manufacturing Order has no BOM-linked material requirements."
              />
            ) : (
              <div className="dense-table-wrap">
                <table className="dense-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Required</th>
                      <th>Booked</th>
                      <th>Available</th>
                      <th>Existing Bookings</th>
                      <th>Lot Selection</th>
                      <th>Qty</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.materials.map((material) => {
                      const editor = materialEditors[material.bomItemId] ?? createMaterialEditor(material);
                      const lotOptions = getLotOptionLabels(material);

                      return (
                        <tr key={material.bomItemId}>
                          <td>
                            <div className="stack stack--tight">
                              <strong>{material.componentItemName}</strong>
                              <span className="muted-copy--small mono">
                                {material.componentItemCode} / {material.unitOfMeasure}
                              </span>
                              {material.notes ? (
                                <span className="muted-copy--small">{material.notes}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="dense-table__cell--right mono">{material.requiredQuantity}</td>
                          <td className="dense-table__cell--right mono">{material.bookedQuantity}</td>
                          <td className="dense-table__cell--right mono">{material.availableQuantity}</td>
                          <td>
                            {material.bookings.length > 0 ? (
                              <div className="stack stack--tight">
                                {material.bookings.map((booking) => (
                                  <button
                                    key={booking.id}
                                    type="button"
                                    className="button button--ghost"
                                    onClick={() => {
                                      setMaterialEditors((current) => ({
                                        ...current,
                                        [material.bomItemId]: {
                                          bookingId: booking.id,
                                          stockLotId: String(booking.stockLotId),
                                          quantity: String(booking.quantity),
                                        },
                                      }));
                                    }}
                                  >
                                    {booking.lotNumber} / {booking.quantity}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="muted-copy--small">No lot booked yet</span>
                            )}
                          </td>
                          <td>
                            <select
                              className="control control--dense"
                              value={editor.stockLotId}
                              onChange={(event) =>
                                setMaterialEditors((current) => ({
                                  ...current,
                                  [material.bomItemId]: {
                                    ...editor,
                                    stockLotId: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">Select lot</option>
                              {lotOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              className="control control--dense"
                              type="number"
                              min={1}
                              step="1"
                              value={editor.quantity}
                              onChange={(event) =>
                                setMaterialEditors((current) => ({
                                  ...current,
                                  [material.bomItemId]: {
                                    ...editor,
                                    quantity: event.target.value,
                                  },
                                }))
                              }
                            />
                          </td>
                          <td>
                            <Button
                              disabled={savingMaterialId === material.bomItemId}
                              onClick={() => {
                                if (!editor.stockLotId || Number(editor.quantity) <= 0) {
                                  setWorkspaceError('Select a lot and enter a booking quantity greater than zero.');
                                  return;
                                }

                                void (async () => {
                                  setSavingMaterialId(material.bomItemId);
                                  setWorkspaceError(null);
                                  setMessage(null);
                                  try {
                                    const updatedOrder = editor.bookingId
                                      ? await updateManufacturingOrderMaterialBooking(
                                          order.id,
                                          editor.bookingId,
                                          {
                                            quantity: Number(editor.quantity),
                                          },
                                        )
                                      : await createOrUpdateMaterialBooking(order.id, {
                                          bomItemId: material.bomItemId,
                                          stockLotId: Number(editor.stockLotId),
                                          quantity: Number(editor.quantity),
                                        });

                                    setOrder(updatedOrder);
                                    setHeaderForm(createHeaderState(updatedOrder));
                                    setMaterialEditors(createMaterialEditors(updatedOrder));
                                    setOperationAssignments(createOperationAssignments(updatedOrder));
                                    setMessage('Material booking saved.');
                                  } catch {
                                    setWorkspaceError('Unable to save the material booking.');
                                  } finally {
                                    setSavingMaterialId(null);
                                  }
                                })();
                              }}
                            >
                              {savingMaterialId === material.bomItemId
                                ? 'Saving...'
                                : editor.bookingId
                                  ? 'Update'
                                  : 'Book'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        ) : null}

        {activeTab === 'operations' ? (
          <Panel
            title="Operations"
            description="Assign operators, review sequence status, and jump into the fixed kiosk execution view."
          >
            <DataTable
              columns={[
                {
                  header: 'Seq',
                  width: '64px',
                  align: 'right',
                  cell: (operation) => <span className="mono">{operation.sequence}</span>,
                },
                {
                  header: 'Operation',
                  cell: (operation) => (
                    <div className="stack stack--tight">
                      <strong>{operation.operationName}</strong>
                      <span className="muted-copy--small">{operation.description ?? 'No description'}</span>
                    </div>
                  ),
                },
                {
                  header: 'Workstation',
                  width: '120px',
                  cell: (operation) => operation.workstation ?? '-',
                },
                {
                  header: 'Operator',
                  width: '180px',
                  cell: (operation) => (
                    <select
                      className="control control--dense"
                      value={operationAssignments[operation.id] ?? ''}
                      onChange={(event) =>
                        setOperationAssignments((current) => ({
                          ...current,
                          [operation.id]: event.target.value,
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
                  ),
                },
                {
                  header: 'Status',
                  width: '110px',
                  cell: (operation) => (
                    <Badge tone={operationStatusTone(operation.status)}>
                      {normalizeProductionStatus(operation.status)}
                    </Badge>
                  ),
                },
                {
                  header: 'Planned Qty',
                  width: '100px',
                  align: 'right',
                  cell: (operation) => <span className="mono">{operation.plannedQuantity}</span>,
                },
                {
                  header: 'Completion',
                  cell: (operation) => operation.completionSummary ?? '-',
                },
                {
                  header: 'Actions',
                  width: '190px',
                  cell: (operation) => (
                    <div className="toolbar__group">
                      <Button
                        disabled={savingOperationId === operation.id}
                        onClick={() => {
                          const nextAssignedOperatorId = operationAssignments[operation.id];

                          if (!nextAssignedOperatorId) {
                            setWorkspaceError('Select an operator before saving an operation assignment.');
                            return;
                          }

                          void (async () => {
                            setSavingOperationId(operation.id);
                            setWorkspaceError(null);
                            setMessage(null);
                            try {
                              await updateOperation(operation.id, {
                                assignedOperatorId: Number(nextAssignedOperatorId),
                              });
                              await loadWorkspace();
                              setMessage(`Operation ${operation.sequence} assignment saved.`);
                            } catch {
                              setWorkspaceError('Unable to update the operation assignment.');
                            } finally {
                              setSavingOperationId(null);
                            }
                          })();
                        }}
                      >
                        {savingOperationId === operation.id ? 'Saving...' : 'Assign'}
                      </Button>
                      <ButtonLink href={`/kiosk/operations/${operation.id}`}>Open kiosk</ButtonLink>
                    </div>
                  ),
                },
              ]}
              rows={order.operations}
              getRowKey={(operation) => String(operation.id)}
              emptyState={
                <EmptyState
                  title="No operations"
                  description="This Manufacturing Order has no routing-backed operations."
                />
              }
            />
          </Panel>
        ) : null}

        {activeTab === 'output' ? (
          <div className="split-grid">
            <Panel
              title="Output"
              description="The final operation writes finished-goods output and closes the Manufacturing Order."
            >
              <StatGrid>
                <StatCard label="Finished Lot" value={order.finishedGoodsLotNumber ?? 'Not created'} />
                <StatCard label="Produced Quantity" value={<span className="mono">{order.producedQuantity}</span>} />
                <StatCard label="Scrap Quantity" value={<span className="mono">{order.scrapQuantity}</span>} />
                <StatCard label="Updated" value={formatProductionDateTime(order.updatedAt)} />
              </StatGrid>
            </Panel>

            <div className="page-stack">
              <Panel
                title="Output rule"
                description="Booked materials are auto-consumed when the final operation completes."
              >
                <Notice title="Current state">
                  {order.finishedGoodsLotNumber
                    ? `Finished lot ${order.finishedGoodsLotNumber} is already linked to this Manufacturing Order.`
                    : 'No finished-goods lot has been created yet. It will be created or updated when the final operation completes.'}
                </Notice>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === 'history' ? (
          <Panel
            title="History"
            description="Every key planner and execution event is logged here to preserve downstream traceability."
          >
            <DataTable
              columns={[
                {
                  header: 'When',
                  width: '140px',
                  cell: (entry) => <span className="mono">{formatProductionDateTime(entry.createdAt)}</span>,
                },
                {
                  header: 'Event',
                  width: '120px',
                  cell: (entry) => entry.eventType,
                },
                {
                  header: 'Actor',
                  width: '120px',
                  cell: (entry) => entry.actor,
                },
                {
                  header: 'Message',
                  cell: (entry) => entry.message,
                },
              ]}
              rows={order.history}
              getRowKey={(entry) => String(entry.id)}
              emptyState={
                <EmptyState
                  title="No history entries"
                  description="Planner and execution actions will appear here as the Manufacturing Order moves through release and completion."
                />
              }
            />
          </Panel>
        ) : null}
      </Panel>
    </PageShell>
  );
}
