'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, FormGrid, Notice } from './ui/primitives';
import type { Contact, ContactInput } from '../types/contact';

type ContactFormProps = {
  initial?: Partial<Contact>;
  submitLabel: string;
  onSubmit: (input: ContactInput) => Promise<void>;
};

const PHONE_REGEX = /^[+]?[- ()0-9]{7,20}$/;

export function ContactForm({ initial, submitLabel, onSubmit }: ContactFormProps): JSX.Element {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Name is required.';
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return 'Email must be valid.';
    }

    if (phone && !PHONE_REGEX.test(phone)) {
      return 'Phone must be valid.';
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
        email: email || undefined,
        phone: phone || undefined,
      });
      setSuccess('Saved successfully.');
    } catch {
      setError('Unable to save contact.');
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
        <Field label="Email">
          <input className="control" value={email ?? ''} onChange={(event) => setEmail(event.target.value)} name="email" />
        </Field>
        <Field label="Phone">
          <input className="control" value={phone ?? ''} onChange={(event) => setPhone(event.target.value)} name="phone" />
        </Field>
      </FormGrid>
      <div>
        <Button type="submit" tone="primary" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
      {error ? (
        <Notice title="Unable to save contact" tone="warning">
          {error}
        </Notice>
      ) : null}
      {success ? <Notice title="Success">{success}</Notice> : null}
    </form>
  );
}
