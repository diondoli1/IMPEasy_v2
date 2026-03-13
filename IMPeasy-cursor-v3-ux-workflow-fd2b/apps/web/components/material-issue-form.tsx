'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { MaterialIssueInput } from '../types/inventory';

type MaterialIssueFormProps = {
  submitLabel: string;
  onSubmit: (input: MaterialIssueInput) => Promise<void>;
};

export function MaterialIssueForm({ submitLabel, onSubmit }: MaterialIssueFormProps): JSX.Element {
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!quantity || Number(quantity) < 1) {
      return 'Issue quantity must be greater than zero.';
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
        notes: notes.trim() || undefined,
      });
      setSuccess('Material issue recorded.');
      setQuantity('1');
      setNotes('');
    } catch {
      setError('Unable to record material issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label>
        Issue Quantity
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          name="quantity"
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
