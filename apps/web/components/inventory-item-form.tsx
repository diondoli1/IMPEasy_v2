'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, FormGrid, Notice } from './ui/primitives';
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
    <form onSubmit={handleSubmit} className="page-stack">
      <FormGrid columns={2}>
        <Field label="Item">
          <select className="control" value={itemId} onChange={(event) => setItemId(event.target.value)} name="itemId">
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantity On Hand">
          <input
            className="control"
            type="number"
            min={0}
            value={quantityOnHand}
            onChange={(event) => setQuantityOnHand(event.target.value)}
            name="quantityOnHand"
          />
        </Field>
      </FormGrid>
      <div>
        <Button type="submit" tone="primary" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
      {error ? (
        <Notice title="Unable to save inventory item" tone="warning">
          {error}
        </Notice>
      ) : null}
      {success ? <Notice title="Success">{success}</Notice> : null}
    </form>
  );
}
