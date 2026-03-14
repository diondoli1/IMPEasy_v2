'use client';

import Link from 'next/link';
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
  Toolbar,
  ToolbarGroup,
} from './ui/primitives';

type ManufacturingOrderWorkspaceProps = {
  manufacturingOrderId: number;
};

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
  const [bookingAll, setBookingAll] = useState(false);

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

  const canRelease = order.status === 'planned' && order.bookingCompletenessPercent >= 100;

  return (
    <PageShell
      eyebrow="Production"
      title={`Manufacturing order ${order.documentNumber}`}
      description=""
      actions={
        <>
          <ButtonLink href="/manufacturing-orders">Back</ButtonLink>
          {message ? (
            <span className="mo-detail__saved-badge">Saved</span>
          ) : null}
          <Button tone="utility" disabled title="Delete not implemented">
            Delete
          </Button>
          <Button tone="utility" disabled title="Copy not implemented">
            Copy
          </Button>
          <span className="mo-detail__action-divider" />
          <Button tone="utility" disabled title="PDF export not implemented">
            PDF wide
          </Button>
          <Button tone="utility" disabled title="PDF export not implemented">
            PDF medium
          </Button>
          <Button tone="utility" disabled title="PDF export not implemented">
            PDF narrow
          </Button>
          <Button tone="utility" disabled title="Print not implemented">
            Print
          </Button>
          <Button
            tone="primary"
            disabled={!canRelease || releasing}
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
            {releasing ? 'Releasing...' : 'Go to production'}
          </Button>
        </>
      }
    >
      {workspaceError ? (
        <Notice title="Action failed" tone="warning">
          {workspaceError}
        </Notice>
      ) : null}
      {message ? <Notice title="Saved">{message}</Notice> : null}

      {/* Two-column order info - MRPeasy layout */}
      <div className="mo-detail__order-info split-grid">
        <div className="mo-detail__order-info-col">
          <Panel title="Order info" compactHeader>
            <form
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
                    setMessage('Manufacturing Order saved.');
                  } catch {
                    setWorkspaceError('Unable to save the Manufacturing Order.');
                  } finally {
                    setSavingHeader(false);
                  }
                })();
              }}
            >
              <FormGrid columns={2}>
                <Field label="Number" required>
                  <input className="control" value={order.documentNumber} readOnly />
                </Field>
                <Field label="Product group">
                  <input className="control" value="—" readOnly />
                </Field>
                <Field label="Product">
                  <input
                    className="control"
                    value={`${order.itemCode} ${order.itemName}`}
                    readOnly
                  />
                </Field>
                <Field label="Files">
                  <input className="control" value="—" readOnly />
                </Field>
                <Field label="Quantity" required>
                  <input className="control" value={String(order.quantity)} readOnly />
                </Field>
                <Field label="Due date">
                  <input
                    className="control"
                    type="date"
                    value={headerForm.dueDate}
                    onChange={(event) =>
                      setHeaderForm((current) =>
                        current ? { ...current, dueDate: event.target.value } : current,
                      )
                    }
                  />
                </Field>
                <Field label="Assigned to" required>
                  <select
                    className="control"
                    value={headerForm.assignedOperatorId}
                    onChange={(event) =>
                      setHeaderForm((current) =>
                        current
                          ? { ...current, assignedOperatorId: event.target.value }
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
                <Field label="Target lot">
                  <input
                    className="control"
                    value={order.finishedGoodsLotNumber ?? '—'}
                    readOnly
                  />
                </Field>
                <Field label="Customer orders">
                  <input
                    className="control"
                    value={order.salesOrderNumber}
                    readOnly
                  />
                </Field>
              </FormGrid>
              <Field label="Notes">
                <textarea
                  className="control"
                  value={headerForm.notes}
                  onChange={(event) =>
                    setHeaderForm((current) =>
                      current ? { ...current, notes: event.target.value } : current,
                    )
                  }
                />
              </Field>
              <div style={{ marginTop: 12 }}>
                <Button type="submit" tone="primary" disabled={savingHeader}>
                  {savingHeader ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Panel>
        </div>

        <div className="mo-detail__order-info-col">
          <Panel title="Status & costs" compactHeader>
            <DataTable
              columns={[
                { header: 'Field', width: '160px', cell: (row) => row.label },
                { header: 'Value', cell: (row) => row.value },
              ]}
              rows={[
                {
                  id: 'created',
                  label: 'Created',
                  value: formatProductionDateTime(order.createdAt),
                },
                {
                  id: 'status',
                  label: 'Status',
                  value: (
                    <Badge tone={manufacturingOrderStatusTone(order.status)}>
                      {normalizeProductionStatus(order.status)}
                    </Badge>
                  ),
                },
                {
                  id: 'release',
                  label: 'Release',
                  value: (
                    <Badge tone={releaseStateTone(order.releaseState)}>
                      {normalizeProductionStatus(order.releaseState)}
                    </Badge>
                  ),
                },
                { id: 'start', label: 'Start', value: '—' },
                { id: 'finish', label: 'Finish', value: '—' },
                { id: 'total-cost', label: 'Total cost', value: '—' },
                { id: 'cost-per-pcs', label: 'Cost per 1 pcs', value: '—' },
                { id: 'cost-materials', label: 'Cost of materials', value: '—' },
                { id: 'overhead', label: 'Applied overhead cost', value: '—' },
                { id: 'labor', label: 'Labor cost', value: '—' },
              ]}
              getRowKey={(row) => row.id}
            />
          </Panel>
        </div>
      </div>

      {/* Parts section - MRPeasy layout */}
      <Panel
        title="Parts"
        description={order.bomName ?? 'No BOM'}
        actions={
          <ToolbarGroup>
            <Button
              tone="secondary"
              disabled={
                bookingAll ||
                order.materials.length === 0 ||
                order.materials.every(
                  (m) =>
                    m.bookedQuantity >= m.requiredQuantity ||
                    (m.availableLots.length === 0 && m.bookings.length === 0),
                )
              }
              onClick={() => {
                void (async () => {
                  setBookingAll(true);
                  setWorkspaceError(null);
                  setMessage(null);
                  try {
                    let currentOrder = order;
                    for (const material of order.materials) {
                      if (material.bookedQuantity >= material.requiredQuantity) continue;
                      const lot = material.availableLots[0];
                      const existingBooking = material.bookings[0];
                      const lotId = lot
                        ? lot.id
                        : existingBooking
                          ? existingBooking.stockLotId
                          : null;
                      if (lotId == null) continue;
                      currentOrder = await createOrUpdateMaterialBooking(order.id, {
                        bomItemId: material.bomItemId,
                        stockLotId: lotId,
                        quantity: material.requiredQuantity,
                      });
                    }
                    setOrder(currentOrder);
                    setMaterialEditors(createMaterialEditors(currentOrder));
                    setMessage('All parts booked.');
                  } catch {
                    setWorkspaceError('Unable to book all parts. Some materials may have insufficient stock.');
                  } finally {
                    setBookingAll(false);
                  }
                })();
              }}
            >
              {bookingAll ? 'Booking...' : 'Book all parts'}
            </Button>
            <Button tone="utility" disabled title="Release all booked parts not implemented">
              Release all booked parts
            </Button>
          </ToolbarGroup>
        }
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
                  <th>Stock item</th>
                  <th>Consumed</th>
                  <th>Booked</th>
                  <th>Lot</th>
                  <th>Status</th>
                  <th>Storage location</th>
                  <th>Available from</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {order.materials.map((material) => {
                  const editor = materialEditors[material.bomItemId] ?? createMaterialEditor(material);
                  const lotOptions = getLotOptionLabels(material);
                  const consumedQty = material.bookings.reduce(
                    (sum, b) => sum + (b.consumedAt ? b.quantity : 0),
                    0,
                  );
                  const bookedQty = material.bookedQuantity;
                  const primaryBooking = material.bookings[0];
                  const status =
                    bookedQty >= material.requiredQuantity
                      ? 'Booked'
                      : bookedQty > 0
                        ? 'Partial'
                        : 'Not booked';

                  return (
                    <tr key={material.bomItemId}>
                      <td>
                        <div className="stack stack--tight">
                          <strong>{material.componentItemName}</strong>
                          <span className="muted-copy--small mono">
                            {material.componentItemCode} / {material.unitOfMeasure}
                          </span>
                        </div>
                      </td>
                      <td className="dense-table__cell--right mono">{consumedQty}</td>
                      <td className="dense-table__cell--right mono">{bookedQty}</td>
                      <td>
                        {primaryBooking ? (
                          <span className="mono">{primaryBooking.lotNumber}</span>
                        ) : (
                          <select
                            className="control control--dense"
                            value={editor.stockLotId}
                            onChange={(event) =>
                              setMaterialEditors((current) => ({
                                ...current,
                                [material.bomItemId]: { ...editor, stockLotId: event.target.value },
                              }))
                            }
                          >
                            <option value="">Select lot</option>
                            {lotOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <Badge
                          tone={
                            status === 'Booked'
                              ? 'success'
                              : status === 'Partial'
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="muted-copy--small">—</td>
                      <td className="muted-copy--small">—</td>
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
                              [material.bomItemId]: { ...editor, quantity: event.target.value },
                            }))
                          }
                          style={{ width: 70, marginRight: 8 }}
                        />
                        <Button
                          disabled={savingMaterialId === material.bomItemId}
                          onClick={() => {
                            if (!editor.stockLotId || Number(editor.quantity) <= 0) {
                              setWorkspaceError(
                                'Select a lot and enter a booking quantity greater than zero.',
                              );
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
                                      { quantity: Number(editor.quantity) },
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

      {/* Operations table - MRPeasy layout */}
      <Panel
        title="Operations"
        description="Operation sequence with workstation, worker assignment, and planned/actual times."
      >
        <DataTable
          columns={[
            {
              header: 'Operation',
              cell: (op) => (
                <div className="stack stack--tight">
                  <strong>{op.operationName}</strong>
                  <span className="muted-copy--small">{op.description ?? ''}</span>
                </div>
              ),
            },
            {
              header: 'Workstation',
              width: '120px',
              cell: (op) => op.workstation ?? '—',
            },
            {
              header: 'Planned start',
              width: '110px',
              cell: () => '—',
            },
            {
              header: 'Planned finish',
              width: '110px',
              cell: () => '—',
            },
            {
              header: 'Worker',
              width: '160px',
              cell: (op) => (
                <select
                  className="control control--dense"
                  value={operationAssignments[op.id] ?? ''}
                  onChange={(event) =>
                    setOperationAssignments((current) => ({
                      ...current,
                      [op.id]: event.target.value,
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
              header: 'Actual start',
              width: '110px',
              cell: () => '—',
            },
            {
              header: 'Actual finish',
              width: '110px',
              cell: () => '—',
            },
            {
              header: 'Quantity',
              width: '90px',
              align: 'right',
              cell: (op) => <span className="mono">{op.plannedQuantity}</span>,
            },
            {
              header: 'Status',
              width: '100px',
              cell: (op) => (
                <Badge tone={operationStatusTone(op.status)}>
                  {normalizeProductionStatus(op.status)}
                </Badge>
              ),
            },
            {
              header: 'Actions',
              width: '140px',
              cell: (op) => (
                <div className="toolbar__group">
                  <Button
                    disabled={savingOperationId === op.id}
                    onClick={() => {
                      const nextAssignedOperatorId = operationAssignments[op.id];
                      if (!nextAssignedOperatorId) {
                        setWorkspaceError(
                          'Select an operator before saving an operation assignment.',
                        );
                        return;
                      }
                      void (async () => {
                        setSavingOperationId(op.id);
                        setWorkspaceError(null);
                        setMessage(null);
                        try {
                          await updateOperation(op.id, {
                            assignedOperatorId: Number(nextAssignedOperatorId),
                          });
                          await loadWorkspace();
                          setMessage(`Operation ${op.sequence} assignment saved.`);
                        } catch {
                          setWorkspaceError('Unable to update the operation assignment.');
                        } finally {
                          setSavingOperationId(null);
                        }
                      })();
                    }}
                  >
                    {savingOperationId === op.id ? 'Saving...' : 'Assign'}
                  </Button>
                  <ButtonLink href={`/kiosk/operations/${op.id}`}>Kiosk</ButtonLink>
                </div>
              ),
            },
          ]}
          rows={order.operations}
          getRowKey={(op) => String(op.id)}
          emptyState={
            <EmptyState
              title="No operations"
              description="This Manufacturing Order has no routing-backed operations."
            />
          }
        />
      </Panel>
    </PageShell>
  );
}
