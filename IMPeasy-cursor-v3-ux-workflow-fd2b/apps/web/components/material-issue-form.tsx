'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { MaterialIssueInput } from '../types/inventory';
import { Button, Field, FormGrid } from './ui/primitives';

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
    <form onSubmit={handleSubmit} className="page-stack">
      <FormGrid columns={2}>
        <Field label="Issue Quantity" required>
          <input
            className="control"
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            name="quantity"
          />
        </Field>
        <Field label="Notes">
          <input
            className="control"
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            name="notes"
            placeholder="Optional"
          />
        </Field>
      </FormGrid>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="submit" disabled={loading} tone="primary">
          {loading ? 'Saving...' : submitLabel}
        </Button>
        {error ? <p role="alert" style={{ color: 'var(--color-danger)', margin: 0 }}>{error}</p> : null}
        {success ? <p style={{ color: 'var(--color-success)', margin: 0 }}>{success}</p> : null}
      </div>
    </form>
  );
}
