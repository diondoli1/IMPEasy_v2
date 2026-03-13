'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { RoutingInput } from '../types/routing';

type ItemOption = {
  id: number;
  name: string;
};

type RoutingFormProps = {
  items: ItemOption[];
  submitLabel: string;
  onSubmit: (input: RoutingInput) => Promise<void>;
};

export function RoutingForm({ items, submitLabel, onSubmit }: RoutingFormProps): JSX.Element {
  const [itemId, setItemId] = useState('');
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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label>
        Item
        <select value={itemId} onChange={(event) => setItemId(event.target.value)} name="itemId">
          <option value="">Select item</option>
          {items.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {item.name}
            </option>
          ))}
        </select>
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
