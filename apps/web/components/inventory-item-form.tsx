'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { InventoryItemInput } from '../types/inventory';

type ItemOption = {
  id: number;
  name: string;
};

type InventoryItemFormProps = {
  items: ItemOption[];
  submitLabel: string;
  onSubmit: (input: InventoryItemInput) => Promise<void>;
};

export function InventoryItemForm({
  items,
  submitLabel,
  onSubmit,
}: InventoryItemFormProps): JSX.Element {
  const [itemId, setItemId] = useState('');
  const [quantityOnHand, setQuantityOnHand] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!itemId || Number(itemId) < 1) {
      return 'Item is required.';
    }

    if (!quantityOnHand || Number(quantityOnHand) < 0) {
      return 'Quantity on hand must be zero or greater.';
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
        quantityOnHand: Number(quantityOnHand),
      });
      setSuccess('Saved successfully.');
      setQuantityOnHand('0');
    } catch {
      setError('Unable to save inventory item.');
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
        Quantity On Hand
        <input
          type="number"
          min={0}
          value={quantityOnHand}
          onChange={(event) => setQuantityOnHand(event.target.value)}
          name="quantityOnHand"
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
