'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import type { FormEvent } from 'react';

import { Badge, Button, DataTable, Field, Notice, Panel } from './ui/primitives';
import type { Invoice } from '../types/invoice';
import type {
  Shipment,
  ShipmentInput,
  ShipmentInputLine,
  ShippingAvailabilityLine,
} from '../types/shipment';

type ShipmentCreationPanelProps = {
  salesOrderId: number;
  salesOrderStatus: string;
  availability: ShippingAvailabilityLine[];
  shipments: Shipment[];
  invoicesByShipmentId: Record<number, Invoice | undefined>;
  onCreate: (input: ShipmentInput) => Promise<Shipment>;
  onShip: (shipmentId: number) => Promise<Shipment>;
  onDeliver: (shipmentId: number) => Promise<Shipment>;
  onGenerateInvoice: (shipmentId: number) => Promise<Invoice>;
  onMarkInvoicePaid: (shipmentId: number) => Promise<Invoice>;
};

function canCreateShipment(status: string): boolean {
  return status === 'released' || status === 'in_production';
}

function formatShipmentLabel(shipment: Pick<Shipment, 'id' | 'number'>): string {
  return shipment.number || `Shipment #${shipment.id}`;
}

function formatInvoiceLabel(invoice: Pick<Invoice, 'id' | 'number'>): string {
  return invoice.number || `Invoice #${invoice.id}`;
}

export function ShipmentCreationPanel({
  salesOrderId,
  salesOrderStatus,
  availability,
  shipments,
  invoicesByShipmentId,
  onCreate,
  onShip,
  onDeliver,
  onGenerateInvoice,
  onMarkInvoicePaid,
}: ShipmentCreationPanelProps): JSX.Element {
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [transitioningShipment, setTransitioningShipment] = useState<{
    action: 'ship' | 'deliver' | 'invoice' | 'pay';
    shipmentId: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const shipmentCreationAllowed = canCreateShipment(salesOrderStatus);

  const validate = (): ShipmentInputLine[] | string => {
    if (!shipmentCreationAllowed) {
      return 'Shipment creation requires a released or in_production sales order.';
    }

    const lines: ShipmentInputLine[] = [];

    for (const line of availability) {
      const rawValue = quantities[line.salesOrderLineId]?.trim() ?? '';
      if (rawValue.length === 0) {
        continue;
      }

      const quantity = Number(rawValue);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return `Shipment quantity for line ${line.salesOrderLineId} must be a whole number greater than zero.`;
      }

      if (quantity > line.availableToShipQuantity) {
        return `Shipment quantity for line ${line.salesOrderLineId} cannot exceed ${line.availableToShipQuantity}.`;
      }

      lines.push({
        salesOrderLineId: line.salesOrderLineId,
        quantity,
      });
    }

    if (lines.length === 0) {
      return 'Enter at least one shipment quantity greater than zero.';
    }

    return lines;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const validationResult = validate();
    if (typeof validationResult === 'string') {
      setError(validationResult);
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await onCreate({
        salesOrderId,
        notes: notes.trim() || undefined,
        lines: validationResult,
      });
      setNotes('');
      setQuantities({});
      setSuccess(`Shipment #${created.id} created.`);
    } catch {
      setError('Unable to create shipment.');
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (shipmentId: number): Promise<void> => {
    setTransitioningShipment({ action: 'ship', shipmentId });
    setError(null);
    setSuccess(null);

    try {
      const shipped = await onShip(shipmentId);
      setSuccess(`${formatShipmentLabel(shipped)} shipped.`);
    } catch {
      setError('Unable to ship shipment.');
    } finally {
      setTransitioningShipment(null);
    }
  };

  const handleDeliver = async (shipmentId: number): Promise<void> => {
    setTransitioningShipment({ action: 'deliver', shipmentId });
    setError(null);
    setSuccess(null);

    try {
      const delivered = await onDeliver(shipmentId);
      setSuccess(`${formatShipmentLabel(delivered)} delivered.`);
    } catch {
      setError('Unable to deliver shipment.');
    } finally {
      setTransitioningShipment(null);
    }
  };

  const handleGenerateInvoice = async (shipmentId: number): Promise<void> => {
    setTransitioningShipment({ action: 'invoice', shipmentId });
    setError(null);
    setSuccess(null);

    try {
      const invoice = await onGenerateInvoice(shipmentId);
      setSuccess(`${formatInvoiceLabel(invoice)} generated for ${invoice.shipmentNumber}.`);
    } catch {
      setError('Unable to generate invoice.');
    } finally {
      setTransitioningShipment(null);
    }
  };

  const handleMarkInvoicePaid = async (shipmentId: number): Promise<void> => {
    setTransitioningShipment({ action: 'pay', shipmentId });
    setError(null);
    setSuccess(null);

    try {
      const invoice = await onMarkInvoicePaid(shipmentId);
      setSuccess(`${formatInvoiceLabel(invoice)} marked paid for ${invoice.shipmentNumber}.`);
    } catch {
      setError('Unable to record invoice payment.');
    } finally {
      setTransitioningShipment(null);
    }
  };

  const formatInvoiceSummary = (invoice: Invoice): string => {
    if (invoice.paidAt) {
      return `${formatInvoiceLabel(invoice)} (${invoice.status}) - Total ${invoice.totalAmount} - Paid at ${invoice.paidAt}`;
    }

    return `${formatInvoiceLabel(invoice)} (${invoice.status}) - Total ${invoice.totalAmount}`;
  };

  return (
    <div className="page-stack">
      <Panel
        title="Create shipment"
        description="Enter ship quantities per line and generate a shipment record. Quantities are validated against available-to-ship."
      >
        {!shipmentCreationAllowed ? (
          <Notice title="Shipment creation disabled" tone="warning">
            Shipment creation requires a released or in_production sales order.
          </Notice>
        ) : null}
        {error ? (
          <Notice title="Unable to complete action" tone="warning">
            {error}
          </Notice>
        ) : null}
        {success ? <Notice title="Success">{success}</Notice> : null}

        <form onSubmit={handleSubmit} className="page-stack">
          <DataTable
            caption="Shipping availability"
            columns={[
              { header: 'Line', width: '90px', cell: (line) => <span className="mono">{line.salesOrderLineId}</span> },
              {
                header: 'Item',
                cell: (line) => (
                  <div className="stack stack--tight">
                    <strong>{line.itemName}</strong>
                    <span className="muted-copy--small mono">
                      {line.itemCode ?? `Item ${line.itemId}`}
                    </span>
                  </div>
                ),
              },
              { header: 'Ordered', width: '90px', cell: (line) => <span className="mono">{line.orderedQuantity}</span> },
              { header: 'Shipped', width: '90px', cell: (line) => <span className="mono">{line.shippedQuantity}</span> },
              { header: 'Remaining', width: '110px', cell: (line) => <span className="mono">{line.remainingQuantity}</span> },
              { header: 'Stock', width: '90px', cell: (line) => <span className="mono">{line.availableStockQuantity}</span> },
              {
                header: 'Status',
                width: '160px',
                cell: (line) =>
                  line.blockedReason ? (
                    <Badge tone="warning">{line.blockedReason}</Badge>
                  ) : (
                    <Badge tone="success">Ready</Badge>
                  ),
              },
              {
                header: 'Ship qty',
                width: '120px',
                cell: (line) => (
                  <input
                    className="control control--dense"
                    type="number"
                    min={0}
                    value={quantities[line.salesOrderLineId] ?? ''}
                    aria-label={`Ship quantity for line ${line.salesOrderLineId}`}
                    disabled={!shipmentCreationAllowed || line.availableToShipQuantity === 0}
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [line.salesOrderLineId]: event.target.value,
                      }))
                    }
                  />
                ),
              },
            ]}
            rows={availability}
            getRowKey={(line) => String(line.salesOrderLineId)}
          />

          <Field label="Shipment notes">
            <textarea
              className="control"
              aria-label="Shipment notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>

          <div>
            <Button type="submit" tone="primary" disabled={loading || !shipmentCreationAllowed}>
              {loading ? 'Creating...' : 'Create shipment'}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Shipments"
        description="Existing shipments created from this sales order."
      >
        <DataTable
          columns={[
            {
              header: 'Shipment',
              width: '170px',
              cell: (shipment) => <span className="mono">{formatShipmentLabel(shipment)}</span>,
            },
            {
              header: 'Status',
              width: '120px',
              cell: (shipment) => <Badge tone={shipment.status === 'delivered' ? 'success' : 'info'}>{shipment.status}</Badge>,
            },
            { header: 'Notes', cell: (shipment) => shipment.notes ?? <span className="muted-copy">No notes</span> },
            {
              header: 'Lines',
              cell: (shipment) => (
                <span className="muted-copy--small">
                  {shipment.shipmentLines
                    .map(
                      (line) =>
                        `${line.itemName || line.itemCode || `Item ${line.itemId}`} (${line.quantity}, picked ${line.pickedQuantity ?? 0})`,
                    )
                    .join(', ')}
                </span>
              ),
            },
            {
              header: 'Invoice',
              cell: (shipment) => {
                const invoice = invoicesByShipmentId[shipment.id];
                return invoice ? (
                  <span className="muted-copy--small">{formatInvoiceSummary(invoice)}</span>
                ) : shipment.status === 'delivered' ? (
                  <span className="muted-copy--small">Ready to invoice</span>
                ) : (
                  <span className="muted-copy--small">Not generated</span>
                );
              },
            },
            {
              header: 'Workspace',
              width: '140px',
              cell: (shipment) => <Link href={`/shipments/${shipment.id}`}>Open shipment</Link>,
            },
            {
              header: 'Actions',
              width: '220px',
              cell: (shipment) => {
                const invoice = invoicesByShipmentId[shipment.id];
                if (shipment.status === 'draft') {
                  return <span className="muted-copy--small">No action</span>;
                }
                if (shipment.status === 'picked') {
                  return (
                    <Button
                      onClick={() => void handleShip(shipment.id)}
                      disabled={
                        transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'ship'
                      }
                    >
                      {transitioningShipment?.shipmentId === shipment.id &&
                      transitioningShipment.action === 'ship'
                        ? 'Shipping...'
                        : 'Ship shipment'}
                    </Button>
                  );
                }
                if (shipment.status === 'shipped') {
                  return (
                    <Button
                      onClick={() => void handleDeliver(shipment.id)}
                      disabled={
                        transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'deliver'
                      }
                    >
                      {transitioningShipment?.shipmentId === shipment.id &&
                      transitioningShipment.action === 'deliver'
                        ? 'Delivering...'
                        : 'Deliver shipment'}
                    </Button>
                  );
                }
                if (shipment.status === 'delivered' && !invoice) {
                  return (
                    <Button
                      onClick={() => void handleGenerateInvoice(shipment.id)}
                      disabled={
                        transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'invoice'
                      }
                    >
                      {transitioningShipment?.shipmentId === shipment.id &&
                      transitioningShipment.action === 'invoice'
                        ? 'Generating...'
                        : 'Generate invoice'}
                    </Button>
                  );
                }
                if (invoice?.status === 'issued') {
                  return (
                    <Button
                      onClick={() => void handleMarkInvoicePaid(shipment.id)}
                      disabled={
                        transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'pay'
                      }
                    >
                      {transitioningShipment?.shipmentId === shipment.id &&
                      transitioningShipment.action === 'pay'
                        ? 'Recording payment...'
                        : 'Mark invoice paid'}
                    </Button>
                  );
                }
                return <span className="muted-copy--small">No action</span>;
              },
            },
          ]}
          rows={shipments}
          getRowKey={(shipment) => String(shipment.id)}
          emptyState={
            <div className="page-stack">
              <Notice title="No shipments yet">No shipments created.</Notice>
            </div>
          }
        />
      </Panel>
    </div>
  );
}
