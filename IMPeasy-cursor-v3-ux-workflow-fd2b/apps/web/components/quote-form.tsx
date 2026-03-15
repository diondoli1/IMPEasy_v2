'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { QuoteInput } from '../types/quote';

type CustomerOption = {
  id: number;
  name: string;
};

type QuoteFormProps = {
  customers: CustomerOption[];
  submitLabel: string;
  onSubmit: (input: QuoteInput) => Promise<void>;
};

export function QuoteForm({ customers, submitLabel, onSubmit }: QuoteFormProps): JSX.Element {
  const [customerId, setCustomerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!customerId) {
      return 'Customer is required.';
    }

    if (Number(customerId) < 1) {
      return 'Customer is required.';
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
        customerId: Number(customerId),
        notes: notes || undefined,
      });
      setSuccess('Saved successfully.');
    } catch {
      setError('Unable to save quote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label>
        Customer
        <select
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          name="customerId"
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={String(customer.id)}>
              {customer.name}
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
