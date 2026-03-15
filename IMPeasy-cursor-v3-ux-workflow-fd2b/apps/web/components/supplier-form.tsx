'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { Supplier, SupplierInput } from '../types/supplier';

type SupplierFormProps = {
  initial?: Partial<Supplier>;
  submitLabel: string;
  onSubmit: (input: SupplierInput) => Promise<void>;
  allowStatusChange?: boolean;
};

const PHONE_REGEX = /^[+]?[- ()0-9]{7,20}$/;

export function SupplierForm({
  initial,
  submitLabel,
  onSubmit,
  allowStatusChange = false,
}: SupplierFormProps): JSX.Element {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [paymentTerm, setPaymentTerm] = useState(
    (initial as { paymentTerm?: string } | undefined)?.paymentTerm ?? '',
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Name is required.';
    }

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return 'Email must be valid.';
    }

    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
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
    setSuccess(null);

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        ...(paymentTerm.trim() ? { paymentTerm: paymentTerm.trim() } : {}),
        ...(allowStatusChange ? { isActive } : {}),
      });
      setSuccess('Saved successfully.');
    } catch {
      setError('Unable to save supplier.');
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
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" />
      </label>
      <label>
        Phone
        <input value={phone} onChange={(event) => setPhone(event.target.value)} name="phone" />
      </label>
      <label>
        Payment Period
        <input
          value={paymentTerm}
          onChange={(event) => setPaymentTerm(event.target.value)}
          name="paymentTerm"
          placeholder="e.g. Net 30"
        />
      </label>
      {allowStatusChange ? (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            name="isActive"
          />
          Active supplier
        </label>
      ) : null}
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : submitLabel}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </form>
  );
}
