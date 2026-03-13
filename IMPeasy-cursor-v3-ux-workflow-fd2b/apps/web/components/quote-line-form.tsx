'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { QuoteLineInput } from '../types/quote-line';

type ItemOption = {
  id: number;
  name: string;
};

type QuoteLineFormProps = {
  items: ItemOption[];
  submitLabel: string;
  onSubmit: (input: QuoteLineInput) => Promise<void>;
};

export function QuoteLineForm({ items, submitLabel, onSubmit }: QuoteLineFormProps): JSX.Element {
  const [itemId, setItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!itemId || Number(itemId) < 1) {
      return 'Item is required.';
    }

    if (!quantity || Number(quantity) < 1) {
      return 'Quantity must be greater than zero.';
    }

    if (!unitPrice || Number(unitPrice) < 0) {
      return 'Unit price must be zero or greater.';
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

    try {
      await onSubmit({
        itemId: Number(itemId),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      });
      setSuccess('Line added successfully.');
      setQuantity('1');
      setUnitPrice('0');
    } catch {
      setError('Unable to add quote line.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label>
        Item
        <select value={itemId} onChange={(event) => setItemId(event.target.value)} name="itemId">
          <option value="">Select item</option>
          {items.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          name="quantity"
        />
      </label>
      <label>
        Unit Price
        <input
          type="number"
          min={0}
          step="0.01"
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          name="unitPrice"
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
