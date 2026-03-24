'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, FormGrid, Notice } from './ui/primitives';
import type { Item, ItemInput } from '../types/item';

type ItemFormProps = {
  initial?: Partial<Item>;
  submitLabel: string;
  onSubmit: (input: ItemInput) => Promise<void>;
};

export function ItemForm({ initial, submitLabel, onSubmit }: ItemFormProps): JSX.Element {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
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
        name: name.trim(),
        description: description || undefined,
      });
      setSuccess('Saved successfully.');
    } catch {
      setError('Unable to save item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-stack">
      <FormGrid columns={2}>
        <Field label="Name">
          <input className="control" value={name} onChange={(event) => setName(event.target.value)} name="name" />
        </Field>
        <Field label="Description">
          <textarea
            className="control"
            value={description ?? ''}
            onChange={(event) => setDescription(event.target.value)}
            name="description"
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
        <Notice title="Unable to save item" tone="warning">
          {error}
        </Notice>
      ) : null}
      {success ? <Notice title="Success">{success}</Notice> : null}
    </form>
  );
}
