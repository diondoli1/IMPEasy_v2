'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { PurchaseOrderLineReceiptInput } from '../types/purchase-order-line';

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
    return <p>Fully received.</p>;
  }

  return (
    <form noValidate onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, minWidth: 220 }}>
      <label>
        Receipt Quantity
        <input
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          name="quantity"
        />
      </label>
      {existingLots.length > 0 ? (
        <label>
          Existing Lot
          <select
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
        </label>
      ) : null}
      <label>
        Lot Number
        <input
          type="text"
          value={lotNumber}
          onChange={(event) => setLotNumber(event.target.value)}
          name="lotNumber"
          placeholder="LOT-2026-001"
          disabled={Boolean(existingLotId)}
        />
      </label>
      <label>
        Receipt Date
        <input
          type="date"
          value={receiptDate}
          onChange={(event) => setReceiptDate(event.target.value)}
          name="receiptDate"
        />
      </label>
      <label>
        Notes
        <input
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          name="notes"
          placeholder="Optional"
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : submitLabel}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </form>
  );
}
