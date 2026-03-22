'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';

import type { Supplier, SupplierInput } from '../types/supplier';
import { Button, FormGrid, Notice } from './ui/primitives';

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
    <form onSubmit={handleSubmit} className="page-stack">
      <FormGrid columns={2}>
        <div className="field">
          <label className="field__label" htmlFor="supplier-name">
            Name
          </label>
          <input
            id="supplier-name"
            className="control"
            value={name}
            onChange={(event) => setName(event.target.value)}
            name="name"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="supplier-email">
            Email
          </label>
          <input
            id="supplier-email"
            className="control"
            type="text"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            name="email"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="supplier-phone">
            Phone
          </label>
          <input
            id="supplier-phone"
            className="control"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            name="phone"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="supplier-payment-term">
            Payment period
          </label>
          <input
            id="supplier-payment-term"
            className="control"
            value={paymentTerm}
            onChange={(event) => setPaymentTerm(event.target.value)}
            name="paymentTerm"
            placeholder="e.g. Net 30"
          />
        </div>
      </FormGrid>
      {allowStatusChange ? (
        <label className="field" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            name="isActive"
            aria-label="Active supplier"
          />
          <span className="field__label" style={{ marginBottom: 0 }}>
            Active supplier
          </span>
        </label>
      ) : null}
        {error ? (
          <Notice title="Unable to save" tone="warning">
            {error}
          </Notice>
        ) : null}
        {success ? <Notice title="Success">{success}</Notice> : null}
      <div>
        <Button type="submit" tone="primary" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
