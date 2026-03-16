'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MuiButton from '@mui/material/Button';
import React, { useState } from 'react';

import { createCustomer } from '../lib/api';
import {
  createBlankCustomerInput,
  CUSTOMER_STATUS_OPTIONS,
  createEmptyAddress,
} from '../lib/commercial';
import type { Customer, CustomerInput } from '../types/customer';
import { Field, FormGrid } from './ui/primitives';

type InlineCreateCustomerDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
};

export function InlineCreateCustomerDialog({
  open,
  onClose,
  onCreated,
}: InlineCreateCustomerDialogProps): JSX.Element {
  const [form, setForm] = useState<CustomerInput>(() => createBlankCustomerInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = (): void => {
    setForm(createBlankCustomerInput());
    setError(null);
    onClose();
  };

  const handleSave = async (): Promise<void> => {
    if (!form.name?.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { code: _omitCode, ...formWithoutCode } = form;
      const payload: CustomerInput = {
        ...formWithoutCode,
        name: form.name.trim(),
        status: form.status || undefined,
        regNo: form.regNo?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        vatNumber: form.vatNumber?.trim() || undefined,
        website: form.website?.trim() || undefined,
        contactStarted: form.contactStarted?.trim() || undefined,
        nextContact: form.nextContact?.trim() || undefined,
        billingAddress: form.billingAddress ?? createEmptyAddress(),
        shippingAddress: form.shippingAddress ?? createEmptyAddress(),
        defaultPaymentTerm: form.defaultPaymentTerm || undefined,
        defaultShippingTerm: form.defaultShippingTerm || undefined,
        defaultShippingMethod: form.defaultShippingMethod || undefined,
        defaultDocumentDiscountPercent: form.defaultDocumentDiscountPercent ?? 0,
        defaultTaxRate: form.defaultTaxRate ?? 0,
        internalNotes: form.internalNotes?.trim() || undefined,
        isActive: ['interested', 'permanent_buyer'].includes(form.status ?? ''),
        contacts: form.contacts?.filter((c) => c.name?.trim()).map((c) => ({
          name: c.name.trim(),
          jobTitle: c.jobTitle?.trim(),
          email: c.email?.trim(),
          phone: c.phone?.trim(),
          isPrimary: c.isPrimary ?? false,
          isActive: c.isActive ?? true,
        })) ?? [],
      };
      const created = await createCustomer(payload);
      setForm(createBlankCustomerInput());
      onCreated(created);
      onClose();
    } catch {
      setError('Unable to create customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleBack} maxWidth="sm" fullWidth>
      <DialogTitle>Create Customer</DialogTitle>
      <DialogContent>
        {error ? <p role="alert" style={{ color: 'var(--color-error)' }}>{error}</p> : null}
        <FormGrid columns={2}>
          <Field label="Name">
            <input
              className="control"
              value={form.name ?? ''}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            />
          </Field>
          <Field label="Status">
            <select
              className="control"
              value={form.status ?? 'no_contact'}
              onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
            >
              {CUSTOMER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reg. no.">
            <input
              className="control"
              value={form.regNo ?? ''}
              onChange={(e) => setForm((c) => ({ ...c, regNo: e.target.value }))}
            />
          </Field>
          <Field label="Email">
            <input
              className="control"
              value={form.email ?? ''}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            />
          </Field>
          <Field label="Phone">
            <input
              className="control"
              value={form.phone ?? ''}
              onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            />
          </Field>
          <Field label="Billing Street">
            <input
              className="control"
              value={form.billingAddress?.street ?? ''}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  billingAddress: { ...(c.billingAddress ?? createEmptyAddress()), street: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Billing City">
            <input
              className="control"
              value={form.billingAddress?.city ?? ''}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  billingAddress: { ...(c.billingAddress ?? createEmptyAddress()), city: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Billing Postcode">
            <input
              className="control"
              value={form.billingAddress?.postcode ?? ''}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  billingAddress: { ...(c.billingAddress ?? createEmptyAddress()), postcode: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Billing Country">
            <input
              className="control"
              value={form.billingAddress?.country ?? ''}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  billingAddress: { ...(c.billingAddress ?? createEmptyAddress()), country: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Shipping Street">
            <input
              className="control"
              value={form.shippingAddress?.street ?? ''}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  shippingAddress: { ...(c.shippingAddress ?? createEmptyAddress()), street: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Shipping City">
            <input
              className="control"
              value={form.shippingAddress?.city ?? ''}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  shippingAddress: { ...(c.shippingAddress ?? createEmptyAddress()), city: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Shipping Postcode">
            <input
              className="control"
              value={form.shippingAddress?.postcode ?? ''}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  shippingAddress: { ...(c.shippingAddress ?? createEmptyAddress()), postcode: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Shipping Country">
            <input
              className="control"
              value={form.shippingAddress?.country ?? ''}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  shippingAddress: { ...(c.shippingAddress ?? createEmptyAddress()), country: e.target.value },
                }))
              }
            />
          </Field>
        </FormGrid>
      </DialogContent>
      <DialogActions>
        <MuiButton variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </MuiButton>
        <MuiButton variant="contained" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}
