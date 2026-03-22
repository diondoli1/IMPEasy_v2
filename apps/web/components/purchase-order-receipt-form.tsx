'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { PurchaseOrderLineReceiptInput } from '../types/purchase-order-line';
import { Button, Field, FormGrid, Notice } from './ui/primitives';

type PurchaseOrderReceiptFormProps = {
  maxQuantity: number;
  existingLots?: Array<{
    id: number;
    lotNumber: string;
  }>;
  submitLabel: string;
  onSubmit: (input: PurchaseOrderLineReceiptInput) => Promise<void>;
};

export function PurchaseOrderReceiptForm({
  maxQuantity,
  existingLots = [],
  submitLabel,
  onSubmit,
}: PurchaseOrderReceiptFormProps): JSX.Element {
  const [quantity, setQuantity] = useState('1');
  const [existingLotId, setExistingLotId] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!quantity || Number(quantity) < 1) {
      return 'Receipt quantity must be greater than zero.';
    }

    if (Number(quantity) > maxQuantity) {
      return `Receipt quantity cannot exceed remaining quantity (${maxQuantity}).`;
    }

    if (!existingLotId && !lotNumber.trim()) {
      return 'Choose an existing lot or enter a new lot number.';
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit({
        quantity: Number(quantity),
        existingLotId: existingLotId ? Number(existingLotId) : undefined,
        lotNumber: lotNumber.trim() || undefined,
        receiptDate: receiptDate || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess('Receipt recorded.');
      setQuantity('1');
      setExistingLotId('');
      setLotNumber('');
      setReceiptDate('');
      setNotes('');
    } catch {
      setError('Unable to receive purchase order line.');
    } finally {
      setLoading(false);
    }
  };

  if (maxQuantity < 1) {
    return <p className="muted-copy--small">Fully received.</p>;
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="page-stack" style={{ minWidth: 220 }}>
      <Field label="Receipt Quantity">
        <input
          className="control control--dense"
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          name="quantity"
        />
      </Field>
      {existingLots.length > 0 ? (
        <Field label="Existing Lot">
          <select
            className="control control--dense"
            value={existingLotId}
            onChange={(event) => setExistingLotId(event.target.value)}
            name="existingLotId"
          >
            <option value="">Create / use lot number below</option>
            {existingLots.map((lot) => (
              <option key={lot.id} value={String(lot.id)}>
                {lot.lotNumber}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="Lot Number">
        <input
          className="control control--dense"
          type="text"
          value={lotNumber}
          onChange={(event) => setLotNumber(event.target.value)}
          name="lotNumber"
          placeholder="LOT-2026-001"
          disabled={Boolean(existingLotId)}
        />
      </Field>
      <FormGrid columns={2}>
        <Field label="Receipt Date">
          <input
            className="control control--dense"
            type="date"
            value={receiptDate}
            onChange={(event) => setReceiptDate(event.target.value)}
            name="receiptDate"
          />
        </Field>
        <Field label="Notes">
          <input
            className="control control--dense"
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            name="notes"
            placeholder="Optional"
          />
        </Field>
      </FormGrid>
      {error ? (
        <Notice title="Unable to receive" tone="warning">
          {error}
        </Notice>
      ) : null}
      {success ? <Notice title="Success">{success}</Notice> : null}
      <div>
        <Button type="submit" tone="primary" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
