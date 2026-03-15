'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { InventoryAdjustmentInput } from '../types/inventory';

type InventoryAdjustmentFormProps = {
  submitLabel: string;
  onSubmit: (input: InventoryAdjustmentInput) => Promise<void>;
};

export function InventoryAdjustmentForm({
  submitLabel,
  onSubmit,
}: InventoryAdjustmentFormProps): JSX.Element {
  const [delta, setDelta] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!delta || Number(delta) === 0) {
      return 'Adjustment delta must be greater than zero or less than zero.';
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
        delta: Number(delta),
        notes: notes.trim() || undefined,
      });
      setSuccess('Inventory adjustment recorded.');
      setDelta('1');
      setNotes('');
    } catch {
      setError('Unable to record inventory adjustment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label>
        Adjustment Delta
        <input
          type="number"
          step="1"
          value={delta}
          onChange={(event) => setDelta(event.target.value)}
          name="delta"
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
