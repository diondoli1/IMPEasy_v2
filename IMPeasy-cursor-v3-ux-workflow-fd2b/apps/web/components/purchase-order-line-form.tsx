'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { PurchaseOrderLineInput } from '../types/purchase-order-line';

type ItemOption = {
  id: number;
  name: string;
};

type PurchaseOrderLineFormProps = {
  items: ItemOption[];
  submitLabel: string;
  onSubmit: (input: PurchaseOrderLineInput) => Promise<void>;
};

export function PurchaseOrderLineForm({
  items,
  submitLabel,
  onSubmit,
}: PurchaseOrderLineFormProps): JSX.Element {
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('0');
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
    setSuccess(null);

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
      setError('Unable to add purchase order line.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="po-line-form">
      <div className="form-grid form-grid--two" style={{ maxWidth: 520 }}>
        <label className="field">
          <span className="field__label">Item</span>
          <select
            className="control"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            name="itemId"
          >
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Quantity</span>
          <input
            className="control"
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            name="quantity"
          />
        </label>
        <label className="field">
          <span className="field__label">Unit Price</span>
          <input
            className="control"
            type="number"
            min={0}
            step="0.01"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            name="unitPrice"
          />
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
      {error ? <p role="alert" className="muted-copy">{error}</p> : null}
      {success ? <p className="muted-copy">{success}</p> : null}
    </form>
  );
}
