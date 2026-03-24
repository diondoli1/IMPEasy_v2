'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, FormGrid, Notice } from './ui/primitives';
import type { RoutingOperationInput } from '../types/routing';

type RoutingOperationFormProps = {
  submitLabel: string;
  onSubmit: (input: RoutingOperationInput) => Promise<void>;
};

export function RoutingOperationForm({
  submitLabel,
  onSubmit,
}: RoutingOperationFormProps): JSX.Element {
  const [sequence, setSequence] = useState('10');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!sequence || Number(sequence) < 1) {
      return 'Sequence must be greater than zero.';
    }

    if (!name.trim()) {
      return 'Name is required.';
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
        sequence: Number(sequence),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setSuccess('Saved successfully.');
      setName('');
      setDescription('');
    } catch {
      setError('Unable to save routing operation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-stack">
      <FormGrid columns={2}>
        <Field label="Sequence">
          <input
            className="control"
            type="number"
            min={1}
            value={sequence}
            onChange={(event) => setSequence(event.target.value)}
            name="sequence"
          />
        </Field>
        <Field label="Name">
          <input className="control" value={name} onChange={(event) => setName(event.target.value)} name="name" />
        </Field>
        <Field label="Description">
          <textarea
            className="control"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            name="description"
            rows={3}
          />
        </Field>
      </FormGrid>
      <div>
        <Button type="submit" tone="primary" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
      {error ? (
        <Notice title="Unable to save routing operation" tone="warning">
          {error}
        </Notice>
      ) : null}
      {success ? <Notice title="Success">{success}</Notice> : null}
    </form>
  );
}
