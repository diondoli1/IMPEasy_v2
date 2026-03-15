'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import type { FormEvent } from 'react';

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
  onPack: (shipmentId: number) => Promise<Shipment>;
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
  onPack,
  onShip,
  onDeliver,
  onGenerateInvoice,
  onMarkInvoicePaid,
}: ShipmentCreationPanelProps): JSX.Element {
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [transitioningShipment, setTransitioningShipment] = useState<{
    action: 'pack' | 'ship' | 'deliver' | 'invoice' | 'pay';
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

  const handlePack = async (shipmentId: number): Promise<void> => {
    setTransitioningShipment({ action: 'pack', shipmentId });
    setError(null);
    setSuccess(null);

    try {
      const packed = await onPack(shipmentId);
      setSuccess(`${formatShipmentLabel(packed)} picked.`);
    } catch {
      setError('Unable to pick shipment.');
    } finally {
      setTransitioningShipment(null);
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
    <section>
      <h2>Shipments</h2>
      {!shipmentCreationAllowed ? (
        <p>Shipment creation requires a released or in_production sales order.</p>
      ) : null}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Line ID</th>
              <th align="left">Item</th>
              <th align="left">Ordered</th>
              <th align="left">Shipped</th>
              <th align="left">Remaining</th>
              <th align="left">Stock Available</th>
              <th align="left">Status</th>
              <th align="left">Ship Qty</th>
            </tr>
          </thead>
          <tbody>
            {availability.map((line) => (
              <tr key={line.salesOrderLineId}>
                <td>{line.salesOrderLineId}</td>
                <td>
                  <div style={{ display: 'grid', gap: 2 }}>
                    <strong>{line.itemName}</strong>
                    <span>{line.itemCode ?? `Item ${line.itemId}`}</span>
                  </div>
                </td>
                <td>{line.orderedQuantity}</td>
                <td>{line.shippedQuantity}</td>
                <td>{line.remainingQuantity}</td>
                <td>{line.availableStockQuantity}</td>
                <td>{line.blockedReason ?? 'Ready'}</td>
                <td>
                  <input
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <label>
          Shipment notes
          <textarea
            aria-label="Shipment notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <button type="submit" disabled={loading || !shipmentCreationAllowed}>
          {loading ? 'Creating...' : 'Create shipment'}
        </button>
        {error ? <p role="alert">{error}</p> : null}
        {success ? <p>{success}</p> : null}
      </form>
      {shipments.length === 0 ? (
        <p>No shipments created.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Shipment</th>
              <th align="left">Status</th>
              <th align="left">Notes</th>
              <th align="left">Lines</th>
              <th align="left">Invoice</th>
              <th align="left">Workspace</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => {
              const invoice = invoicesByShipmentId[shipment.id];

              return (
                <tr key={shipment.id}>
                  <td>{formatShipmentLabel(shipment)}</td>
                  <td>{shipment.status}</td>
                  <td>{shipment.notes ?? 'No notes'}</td>
                  <td>
                    {shipment.shipmentLines
                      .map(
                        (line) =>
                          `${line.itemName || line.itemCode || `Item ${line.itemId}`} (${line.quantity}, picked ${line.pickedQuantity ?? 0})`,
                      )
                      .join(', ')}
                  </td>
                  <td>
                    {invoice
                      ? formatInvoiceSummary(invoice)
                      : shipment.status === 'delivered'
                        ? 'Ready to invoice'
                        : 'Not generated'}
                  </td>
                  <td>
                    <Link href={`/shipments/${shipment.id}`}>Open shipment</Link>
                  </td>
                  <td>
                    {shipment.status === 'draft' ? (
                      <button
                        type="button"
                        aria-label={`Pick shipment ${shipment.id}`}
                        disabled={
                          transitioningShipment?.shipmentId === shipment.id &&
                          transitioningShipment.action === 'pack'
                        }
                        onClick={() => {
                          void handlePack(shipment.id);
                        }}
                      >
                        {transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'pack'
                          ? 'Picking...'
                          : 'Pick shipment'}
                      </button>
                    ) : shipment.status === 'picked' ? (
                      <button
                        type="button"
                        aria-label={`Ship shipment ${shipment.id}`}
                        disabled={
                          transitioningShipment?.shipmentId === shipment.id &&
                          transitioningShipment.action === 'ship'
                        }
                        onClick={() => {
                          void handleShip(shipment.id);
                        }}
                      >
                        {transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'ship'
                          ? 'Shipping...'
                          : 'Ship shipment'}
                      </button>
                    ) : shipment.status === 'shipped' ? (
                      <button
                        type="button"
                        aria-label={`Deliver shipment ${shipment.id}`}
                        disabled={
                          transitioningShipment?.shipmentId === shipment.id &&
                          transitioningShipment.action === 'deliver'
                        }
                        onClick={() => {
                          void handleDeliver(shipment.id);
                        }}
                      >
                        {transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'deliver'
                          ? 'Delivering...'
                          : 'Deliver shipment'}
                      </button>
                    ) : shipment.status === 'delivered' && !invoice ? (
                      <button
                        type="button"
                        aria-label={`Generate invoice for shipment ${shipment.id}`}
                        disabled={
                          transitioningShipment?.shipmentId === shipment.id &&
                          transitioningShipment.action === 'invoice'
                        }
                        onClick={() => {
                          void handleGenerateInvoice(shipment.id);
                        }}
                      >
                        {transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'invoice'
                          ? 'Generating...'
                          : 'Generate invoice'}
                      </button>
                    ) : invoice?.status === 'issued' ? (
                      <button
                        type="button"
                        aria-label={`Mark invoice paid for shipment ${shipment.id}`}
                        disabled={
                          transitioningShipment?.shipmentId === shipment.id &&
                          transitioningShipment.action === 'pay'
                        }
                        onClick={() => {
                          void handleMarkInvoicePaid(shipment.id);
                        }}
                      >
                        {transitioningShipment?.shipmentId === shipment.id &&
                        transitioningShipment.action === 'pay'
                          ? 'Recording payment...'
                          : 'Mark invoice paid'}
                      </button>
                    ) : (
                      'No action'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
