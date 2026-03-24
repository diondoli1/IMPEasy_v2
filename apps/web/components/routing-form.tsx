'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, FormGrid, Notice } from './ui/primitives';
import type { RoutingInput } from '../types/routing';

type ItemOption = {
  id: number;
  name: string;
};

type RoutingFormProps = {
  items: ItemOption[];
  submitLabel: string;
  onSubmit: (input: RoutingInput) => Promise<void>;
  initialItemId?: number;
};

export function RoutingForm({ items, submitLabel, onSubmit, initialItemId }: RoutingFormProps): JSX.Element {
  const [itemId, setItemId] = useState(initialItemId ? String(initialItemId) : '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!itemId || Number(itemId) < 1) {
      return 'Item is required.';
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
        itemId: Number(itemId),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setSuccess('Saved successfully.');
    } catch {
      setError('Unable to save routing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-stack">
      <FormGrid columns={2}>
        <Field label="Item">
          <select className="control" value={itemId} onChange={(event) => setItemId(event.target.value)} name="itemId">
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
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
        <Notice title="Unable to save routing" tone="warning">
          {error}
        </Notice>
      ) : null}
      {success ? <Notice title="Success">{success}</Notice> : null}
    </form>
  );
}
