'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label>
        Sequence
        <input
          type="number"
          min={1}
          value={sequence}
          onChange={(event) => setSequence(event.target.value)}
          name="sequence"
        />
      </label>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} name="name" />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          name="description"
          rows={3}
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
