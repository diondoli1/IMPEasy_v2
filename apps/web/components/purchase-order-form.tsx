'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { PurchaseOrderInput } from '../types/purchase-order';

type SupplierOption = {
  id: number;
  name: string;
};

type PurchaseOrderFormProps = {
  suppliers: SupplierOption[];
  submitLabel: string;
  onSubmit: (input: PurchaseOrderInput) => Promise<void>;
};

export function PurchaseOrderForm({
  suppliers,
  submitLabel,
  onSubmit,
}: PurchaseOrderFormProps): JSX.Element {
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!supplierId || Number(supplierId) < 1) {
      return 'Supplier is required.';
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
        supplierId: Number(supplierId),
        notes: notes.trim() || undefined,
      });
      setSuccess('Saved successfully.');
    } catch {
      setError('Unable to save purchase order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label>
        Supplier
        <select
          value={supplierId}
          onChange={(event) => setSupplierId(event.target.value)}
          name="supplierId"
        >
          <option value="">Select supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={String(supplier.id)}>
              {supplier.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          name="notes"
          rows={4}
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
