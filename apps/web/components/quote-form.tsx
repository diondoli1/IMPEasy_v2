'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, FormGrid, Notice } from './ui/primitives';
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
    <form onSubmit={handleSubmit} className="page-stack">
      <FormGrid columns={2}>
        <Field label="Customer">
          <select
            className="control"
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
        </Field>
        <Field label="Notes">
          <textarea
            className="control"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            name="notes"
            rows={4}
          />
        </Field>
      </FormGrid>
      <div>
        <Button type="submit" tone="primary" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
      {error ? (
        <Notice title="Unable to save quote" tone="warning">
          {error}
        </Notice>
      ) : null}
      {success ? <Notice title="Success">{success}</Notice> : null}
    </form>
  );
}
