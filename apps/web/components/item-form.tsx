'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} name="name" />
      </label>
      <label>
        Description
        <textarea
          value={description ?? ''}
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
