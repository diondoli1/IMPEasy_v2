'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { BomItemInput } from '../types/bom';

type ItemOption = {
  id: number;
  name: string;
};

type BomItemFormProps = {
  items: ItemOption[];
  submitLabel: string;
  onSubmit: (input: BomItemInput) => Promise<void>;
};

export function BomItemForm({ items, submitLabel, onSubmit }: BomItemFormProps): JSX.Element {
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!itemId || Number(itemId) < 1) {
      return 'Item is required.';
    }

    if (!quantity || Number(quantity) < 1) {
      return 'Quantity must be greater than zero.';
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
      });
      setSuccess('Saved successfully.');
      setQuantity('1');
    } catch {
      setError('Unable to save BOM item.');
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
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : submitLabel}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </form>
  );
}
