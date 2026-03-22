'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MuiButton from '@mui/material/Button';

import { PageShell } from '../../../components/ui/page-templates';
import {
  Badge,
  Button,
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
} from '../../../components/ui/primitives';
import { formatCurrency, formatDate } from '../../../lib/commercial';
import {
  createShipmentInvoice,
  deliverShipment,
  getShipment,
  payShipmentInvoice,
  pickShipment,
  shipShipment,
  updateShipment,
  upsertShipmentPicks,
} from '../../../lib/api';
import type { ShipmentDetail } from '../../../types/shipment';

type ShipmentTab = 'header' | 'picking' | 'invoice' | 'history';

export default function ShipmentDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<ShipmentTab>('header');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [headerForm, setHeaderForm] = useState({
    shipDate: '',
    carrierMethod: '',
    trackingNumber: '',
    notes: '',
  });
  const [allocationForms, setAllocationForms] = useState<Record<number, { stockLotId: string; quantity: string; notes: string }>>({});

  const loadShipment = async (): Promise<void> => {
    const data = await getShipment(id);
    setShipment(data);
    setHeaderForm({
      shipDate: data.shipDate?.slice(0, 10) ?? '',
      carrierMethod: data.carrierMethod ?? '',
      trackingNumber: data.trackingNumber ?? '',
      notes: data.notes ?? '',
    });
  };

  useEffect(() => {
    void (async () => {
      try {
        await loadShipment();
      } catch {
        setError('Shipment not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canAllocate = shipment?.status === 'draft' || shipment?.status === 'picked';
  const shipToSummary = useMemo(() => shipment?.shipToAddress.join(', ') ?? '-', [shipment]);

  if (loading) {
    return <p>Loading shipment...</p>;
  }

  if (error || !shipment) {
    return <p role="alert">{error ?? 'Shipment not found.'}</p>;
  }

  return (
    <PageShell
      eyebrow="Shipping"
      title={shipment.number}
      description="Operational shipment workspace for header updates, lot picking, shipping, delivery, and invoice linkage."
      leadingActions={
        <MuiButton component={Link} href="/stock/shipments" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </MuiButton>
      }
      actions={
        <>
          <Badge tone="info">{shipment.status}</Badge>
          <Link className="button button--secondary" href={`/customer-orders/sales-order-${shipment.salesOrderId}`}>
            Open customer order
          </Link>
        </>
      }
    >
      <StatGrid>
        <StatCard label="Sales Order" value={shipment.salesOrderNumber} />
        <StatCard label="Customer" value={shipment.customerName} />
        <StatCard label="Ship Date" value={formatDate(shipment.shipDate)} />
        <StatCard label="Invoice" value={shipment.invoice ? shipment.invoice.number : 'Not created'} />
      </StatGrid>

      <Panel title="Shipment workspace" description="Lot allocation and downstream actions stay in one compact workspace.">
        <Toolbar>
          <ToolbarGroup>
            {([
              ['header', 'Header'],
              ['picking', 'Picking'],
              ['invoice', 'Invoice'],
              ['history', 'History'],
            ] as Array<[ShipmentTab, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`workspace-tab${activeTab === value ? ' workspace-tab--active' : ''}`}
                onClick={() => setActiveTab(value)}
              >
                {label}
              </button>
            ))}
          </ToolbarGroup>
          <ToolbarGroup>
            {shipment.status === 'draft' ? (
              <Button
                onClick={() => {
                  void (async () => {
                    try {
                      await pickShipment(shipment.id);
                      await loadShipment();
                      setMessage('Shipment moved to picked.');
                    } catch {
                      setMessage('Unable to mark the shipment picked.');
                    }
                  })();
                }}
              >
                Pick
              </Button>
            ) : null}
            {shipment.status === 'picked' ? (
              <Button
                onClick={() => {
                  void (async () => {
                    try {
                      await shipShipment(shipment.id);
                      await loadShipment();
                      setMessage('Shipment moved to shipped.');
                    } catch {
                      setMessage('Unable to ship the shipment.');
                    }
                  })();
                }}
              >
                Ship
              </Button>
            ) : null}
            {shipment.status === 'shipped' ? (
              <Button
                onClick={() => {
                  void (async () => {
                    try {
                      await deliverShipment(shipment.id);
                      await loadShipment();
                      setMessage('Shipment moved to delivered.');
                    } catch {
                      setMessage('Unable to deliver the shipment.');
                    }
                  })();
                }}
              >
                Deliver
              </Button>
            ) : null}
          </ToolbarGroup>
        </Toolbar>

        {message ? <Notice title="Shipment update">{message}</Notice> : null}

        {activeTab === 'header' ? (
          <div className="split-grid">
            <Panel title="Header" description="Edit the ship date, carrier, tracking, and notes without leaving the shipment workspace.">
              <form
                className="page-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  void (async () => {
                    try {
                      const updated = await updateShipment(shipment.id, {
                        shipDate: headerForm.shipDate || undefined,
                        carrierMethod: headerForm.carrierMethod || undefined,
                        trackingNumber: headerForm.trackingNumber || undefined,
                        notes: headerForm.notes || undefined,
                      });
                      setShipment(updated);
                      setMessage('Shipment header saved.');
                    } catch {
                      setMessage('Unable to save the shipment header.');
                    }
                  })();
                }}
              >
                <FormGrid columns={2}>
                  <Field label="Ship date">
                    <input
                      className="control"
                      type="date"
                      value={headerForm.shipDate}
                      onChange={(event) =>
                        setHeaderForm((current) => ({ ...current, shipDate: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Carrier / method">
                    <input
                      className="control"
                      value={headerForm.carrierMethod}
                      onChange={(event) =>
                        setHeaderForm((current) => ({
                          ...current,
                          carrierMethod: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Tracking">
                    <input
                      className="control"
                      value={headerForm.trackingNumber}
                      onChange={(event) =>
                        setHeaderForm((current) => ({
                          ...current,
                          trackingNumber: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </FormGrid>
                <Field label="Notes">
                  <textarea
                    className="control"
                    rows={4}
                    value={headerForm.notes}
                    onChange={(event) =>
                      setHeaderForm((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </Field>
                <div>
                  <Button type="submit" tone="primary">
                    Save header
                  </Button>
                </div>
              </form>
            </Panel>

            <Panel title="Ship-to snapshot" description="Ship-to fields stay frozen on the shipment even if the source sales order changes later.">
              <DataTable
                columns={[
                  { header: 'Field', width: '140px', cell: (row) => row.label },
                  { header: 'Value', cell: (row) => row.value },
                ]}
                rows={[
                  { id: 'customer', label: 'Customer', value: shipment.customerName },
                  { id: 'address', label: 'Ship To', value: shipToSummary },
                  { id: 'tracking', label: 'Tracking', value: shipment.trackingNumber ?? '-' },
                ]}
                getRowKey={(row) => row.id}
              />
            </Panel>
          </div>
        ) : null}

        {activeTab === 'picking' ? (
          <DataTable
            columns={[
              {
                header: 'Sales Order Line',
                cell: (line) => (
                  <div className="stack stack--tight">
                    <span className="mono">SOL-{line.salesOrderLineId}</span>
                    <strong>{line.itemName}</strong>
                    <span className="muted-copy--small">{line.itemCode ?? `Item ${line.itemId}`}</span>
                  </div>
                ),
              },
              { header: 'Required', width: '90px', align: 'right', cell: (line) => line.quantity },
              { header: 'Picked', width: '90px', align: 'right', cell: (line) => line.pickedQuantity },
              {
                header: 'Available Lots',
                cell: (line) =>
                  line.availableLots.length > 0
                    ? line.availableLots
                        .map((lot) => `${lot.lotNumber} (${lot.availableQuantity})`)
                        .join(', ')
                    : 'No available lots',
              },
              {
                header: 'Pick Allocation',
                cell: (line) => (
                  <div className="page-stack">
                    {line.picks.length > 0 ? (
                      <DataTable
                        columns={[
                          { header: 'Lot', width: '120px', cell: (pick) => pick.lotNumber },
                          { header: 'Qty', width: '80px', align: 'right', cell: (pick) => pick.quantity },
                          { header: 'Notes', cell: (pick) => pick.notes ?? '-' },
                        ]}
                        rows={line.picks}
                        getRowKey={(pick) => String(pick.id)}
                      />
                    ) : (
                      <EmptyState
                        title="No picks yet"
                        description="Allocate a lot below before moving the shipment to picked."
                      />
                    )}
                    {canAllocate ? (
                      <form
                        className="page-stack"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const current = allocationForms[line.id] ?? {
                            stockLotId: '',
                            quantity: '',
                            notes: '',
                          };
                          void (async () => {
                            try {
                              const updated = await upsertShipmentPicks(shipment.id, [
                                {
                                  shipmentLineId: line.id,
                                  stockLotId: Number(current.stockLotId),
                                  quantity: Number(current.quantity),
                                  notes: current.notes || undefined,
                                },
                              ]);
                              setShipment(updated);
                              setAllocationForms((forms) => ({
                                ...forms,
                                [line.id]: { stockLotId: '', quantity: '', notes: '' },
                              }));
                              setMessage('Pick allocation saved.');
                            } catch {
                              setMessage('Unable to save the pick allocation.');
                            }
                          })();
                        }}
                      >
                        <FormGrid columns={2}>
                          <Field label="Lot">
                            <select
                              className="control"
                              value={allocationForms[line.id]?.stockLotId ?? ''}
                              onChange={(event) =>
                                setAllocationForms((forms) => ({
                                  ...forms,
                                  [line.id]: {
                                    stockLotId: event.target.value,
                                    quantity: forms[line.id]?.quantity ?? '',
                                    notes: forms[line.id]?.notes ?? '',
                                  },
                                }))
                              }
                            >
                              <option value="">Select lot</option>
                              {line.availableLots.map((lot) => (
                                <option key={lot.id} value={String(lot.id)}>
                                  {lot.lotNumber} ({lot.availableQuantity})
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Quantity">
                            <input
                              className="control"
                              type="number"
                              min={1}
                              value={allocationForms[line.id]?.quantity ?? ''}
                              onChange={(event) =>
                                setAllocationForms((forms) => ({
                                  ...forms,
                                  [line.id]: {
                                    stockLotId: forms[line.id]?.stockLotId ?? '',
                                    quantity: event.target.value,
                                    notes: forms[line.id]?.notes ?? '',
                                  },
                                }))
                              }
                              placeholder="Pick quantity"
                            />
                          </Field>
                        </FormGrid>
                        <Field label="Allocation notes">
                          <input
                            className="control"
                            value={allocationForms[line.id]?.notes ?? ''}
                            onChange={(event) =>
                              setAllocationForms((forms) => ({
                                ...forms,
                                [line.id]: {
                                  stockLotId: forms[line.id]?.stockLotId ?? '',
                                  quantity: forms[line.id]?.quantity ?? '',
                                  notes: event.target.value,
                                },
                              }))
                            }
                          />
                        </Field>
                        <div>
                          <Button type="submit" tone="primary">
                            Allocate lot
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                ),
              },
            ]}
            rows={shipment.lines}
            getRowKey={(line) => String(line.id)}
            emptyState={<EmptyState title="No shipment lines" description="Shipment lines will appear once the shipment is created from a sales order." />}
          />
        ) : null}

        {activeTab === 'invoice' ? (
          shipment.invoice ? (
            <div className="page-stack">
              <Panel title="Linked invoice" description="The invoice register stays operational and directly linked back to this shipment.">
                <DataTable
                  columns={[
                    { header: 'Field', width: '180px', cell: (row) => row.label },
                    { header: 'Value', cell: (row) => row.value },
                  ]}
                  rows={[
                    { id: 'number', label: 'Invoice', value: shipment.invoice.number },
                    { id: 'status', label: 'Status', value: shipment.invoice.status },
                    { id: 'total', label: 'Total', value: formatCurrency(shipment.invoice.totalAmount) },
                    { id: 'issue', label: 'Issue Date', value: formatDate(shipment.invoice.issueDate) },
                    { id: 'due', label: 'Due Date', value: formatDate(shipment.invoice.dueDate) },
                    { id: 'paid', label: 'Paid Date', value: formatDate(shipment.invoice.paidAt) },
                  ]}
                  getRowKey={(row) => row.id}
                />
                <div className="page-shell__actions">
                  <Link className="button button--secondary" href={`/invoices/${shipment.invoice.id}`}>
                    Open invoice
                  </Link>
                  {shipment.invoice.status === 'issued' ? (
                    <Button
                      onClick={() => {
                        void (async () => {
                          try {
                            await payShipmentInvoice(shipment.id);
                            await loadShipment();
                            setMessage('Invoice marked paid.');
                          } catch {
                            setMessage('Unable to record invoice payment.');
                          }
                        })();
                      }}
                    >
                      Mark paid
                    </Button>
                  ) : null}
                </div>
              </Panel>
            </div>
          ) : (
            <Panel title="Invoice" description="Generate the operational invoice once the shipment is delivered.">
              <Notice title="Invoice readiness">
                {shipment.status === 'delivered'
                  ? 'This shipment is delivered and ready to invoice.'
                  : 'The invoice action unlocks after the shipment is delivered.'}
              </Notice>
              {shipment.status === 'delivered' ? (
                <Button
                  onClick={() => {
                    void (async () => {
                      try {
                        await createShipmentInvoice(shipment.id);
                        await loadShipment();
                        setMessage('Invoice created from shipment.');
                      } catch {
                        setMessage('Unable to generate the invoice.');
                      }
                    })();
                  }}
                >
                  Generate invoice
                </Button>
              ) : null}
            </Panel>
          )
        ) : null}

        {activeTab === 'history' ? (
          <DataTable
            columns={[
              { header: 'When', width: '140px', cell: (entry) => formatDate(entry.eventDate) },
              { header: 'Event', width: '120px', cell: (entry) => entry.eventType },
              { header: 'Message', cell: (entry) => entry.message },
            ]}
            rows={shipment.history}
            getRowKey={(entry) => `${entry.eventType}-${entry.eventDate}`}
            emptyState={<EmptyState title="No history" description="Shipment events will appear here as work progresses." />}
          />
        ) : null}
      </Panel>
    </PageShell>
  );
}
