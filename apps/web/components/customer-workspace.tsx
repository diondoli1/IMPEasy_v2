'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MuiButton from '@mui/material/Button';

import { createCustomer, getCustomer, updateCustomer } from '../lib/api';
import {
  createBlankCustomerInput,
  CUSTOMER_STATUS_OPTIONS,
  formatCurrency,
  formatDate,
  getCustomerStatusLabel,
  workspaceIdForDocument,
} from '../lib/commercial';
import type { Customer, CustomerInput } from '../types/customer';
import { PageShell } from './ui/page-templates';
import {
  Badge,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  Field,
  FormGrid,
  Notice,
  Panel,
  Toolbar,
  ToolbarGroup,
} from './ui/primitives';

type CustomerWorkspaceProps = {
  customerId?: number;
  returnTo?: string;
};

type CustomerTab = 'general' | 'contacts' | 'addresses' | 'defaults' | 'notes' | 'documents';

const CUSTOMER_TABS: Array<{ value: CustomerTab; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'addresses', label: 'Addresses' },
  { value: 'defaults', label: 'Defaults' },
  { value: 'notes', label: 'Notes' },
  { value: 'documents', label: 'Documents' },
];

function mapCustomerToInput(customer: Customer): CustomerInput {
  return {
    code: customer.code ?? '',
    name: customer.name,
    status: customer.status ?? 'no_contact',
    regNo: customer.regNo ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    vatNumber: customer.vatNumber ?? '',
    contactStarted: customer.contactStarted ? customer.contactStarted.slice(0, 10) : '',
    nextContact: customer.nextContact ? customer.nextContact.slice(0, 10) : '',
    website: customer.website ?? '',
    billingAddress: {
      street: customer.billingAddress.street ?? '',
      city: customer.billingAddress.city ?? '',
      postcode: customer.billingAddress.postcode ?? '',
      stateRegion: customer.billingAddress.stateRegion ?? '',
      country: customer.billingAddress.country ?? '',
    },
    shippingAddress: {
      street: customer.shippingAddress.street ?? '',
      city: customer.shippingAddress.city ?? '',
      postcode: customer.shippingAddress.postcode ?? '',
      stateRegion: customer.shippingAddress.stateRegion ?? '',
      country: customer.shippingAddress.country ?? '',
    },
    defaultPaymentTerm: customer.defaultPaymentTerm ?? '',
    defaultShippingTerm: customer.defaultShippingTerm ?? '',
    defaultShippingMethod: customer.defaultShippingMethod ?? '',
    defaultDocumentDiscountPercent: customer.defaultDocumentDiscountPercent,
    defaultTaxRate: customer.defaultTaxRate,
    internalNotes: customer.internalNotes ?? '',
    isActive: customer.isActive,
    contacts: customer.contacts.map((contact) => ({
      name: contact.name,
      jobTitle: contact.jobTitle ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
    })),
  };
}

export function CustomerWorkspace({ customerId, returnTo }: CustomerWorkspaceProps): JSX.Element {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInput>(() => createBlankCustomerInput());
  const [activeTab, setActiveTab] = useState<CustomerTab>('general');
  const [loading, setLoading] = useState(Boolean(customerId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      return;
    }

    void (async () => {
      try {
        const data = await getCustomer(customerId);
        setCustomer(data);
        setForm(mapCustomerToInput(data));
      } catch {
        setError('Unable to load customer workspace.');
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  const headerBadge = useMemo(() => {
    if (!customerId) {
      return <Badge tone="warning">New customer</Badge>;
    }

    return <Badge tone={customer?.isActive ? 'success' : 'neutral'}>{getCustomerStatusLabel(customer?.status)}</Badge>;
  }, [customer, customerId]);

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const payload: CustomerInput = {
        ...form,
        status: form.status || undefined,
        regNo: form.regNo?.trim() || undefined,
        contactStarted: form.contactStarted?.trim() || undefined,
        nextContact: form.nextContact?.trim() || undefined,
        isActive: ['interested', 'permanent_buyer'].includes(form.status ?? ''),
        contacts:
          form.contacts?.map((contact) => ({
            ...contact,
            name: contact.name.trim(),
            jobTitle: contact.jobTitle?.trim(),
            email: contact.email?.trim(),
            phone: contact.phone?.trim(),
          })) ?? [],
      };

      if (customerId) {
        const updated = await updateCustomer(customerId, payload);
        setCustomer(updated);
        setForm(mapCustomerToInput(updated));
      } else {
        const { code: _omitCode, ...createPayload } = payload;
        const created = await createCustomer(createPayload);
        if (returnTo) {
          router.replace(returnTo);
        } else {
          router.replace(`/customers/${created.id}`);
        }
        return;
      }

      setSaveMessage('Customer saved.');
    } catch {
      setError('Unable to save customer.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading customer workspace...</p>;
  }

  if (error && !customer && customerId) {
    return <p role="alert">{error}</p>;
  }

  return (
    <PageShell
      eyebrow="Customers"
      title={customerId ? `${customer?.code ?? ''} ${customer?.name ?? ''}`.trim() : 'New customer'}
      description="Operational customer card with contacts, addresses, defaults, notes, and linked commercial documents."
      leadingActions={
        <MuiButton component={Link} href={returnTo ?? '/customers'} variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </MuiButton>
      }
      actions={
        <>
          {headerBadge}
          <ButtonLink href="/customer-orders">Customer orders</ButtonLink>
          <Button tone="primary" onClick={() => void handleSave()}>
            {saving ? 'Saving...' : 'Save customer'}
          </Button>
        </>
      }
    >
      <Panel title="Customer workspace" description="The customer card keeps commercial defaults and linked documents in one dense operational surface.">
        <Toolbar>
          <ToolbarGroup>
            {CUSTOMER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`workspace-tab${activeTab === tab.value ? ' workspace-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </ToolbarGroup>
          <ToolbarGroup>
            <span className="muted-copy">Customer code and defaults snapshot into commercial documents.</span>
          </ToolbarGroup>
        </Toolbar>

        {saveMessage ? <Notice title="Saved">{saveMessage}</Notice> : null}
        {error && customer ? <p role="alert">{error}</p> : null}

        {activeTab === 'general' ? (
          <FormGrid columns={2}>
            {customerId ? (
              <Field label="Customer Code">
                <input
                  className="control"
                  value={form.code ?? ''}
                  disabled
                  readOnly
                  aria-label="Customer Code"
                />
              </Field>
            ) : null}
            <Field label="Name">
              <input
                className="control"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Status">
              <select
                className="control"
                value={form.status ?? 'no_contact'}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value }))
                }
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
                onChange={(event) => setForm((current) => ({ ...current, regNo: event.target.value }))}
              />
            </Field>
            <Field label="TAX Number">
              <input
                className="control"
                value={form.vatNumber ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, vatNumber: event.target.value }))}
              />
            </Field>
            <Field label="Phone">
              <input
                className="control"
                value={form.phone ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </Field>
            <Field label="Email">
              <input
                className="control"
                value={form.email ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </Field>
            <Field label="Contact Started">
              <input
                className="control"
                type="date"
                value={form.contactStarted ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, contactStarted: event.target.value }))}
              />
            </Field>
            <Field label="Next Contact">
              <input
                className="control"
                type="date"
                value={form.nextContact ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, nextContact: event.target.value }))}
              />
            </Field>
            <Field label="Tax Rate (%)">
              <input
                className="control"
                type="number"
                min={0}
                step={0.01}
                value={form.defaultTaxRate ?? 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultTaxRate: Number(event.target.value) || 0,
                  }))
                }
              />
            </Field>
            <Field label="Payment Period">
              <input
                className="control"
                value={form.defaultPaymentTerm ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultPaymentTerm: event.target.value }))
                }
              />
            </Field>
            <Field label="Currency">
              <input className="control" value="EUR" disabled />
            </Field>
            <Field label="Website">
              <input
                className="control"
                value={form.website ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
              />
            </Field>
          </FormGrid>
        ) : null}

        {activeTab === 'contacts' ? (
          <div className="page-stack">
            <Toolbar>
              <ToolbarGroup>
                <Badge tone="info">{form.contacts?.length ?? 0} contacts</Badge>
              </ToolbarGroup>
              <ToolbarGroup>
                <Button
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      contacts: [
                        ...(current.contacts ?? []),
                        {
                          name: '',
                          jobTitle: '',
                          email: '',
                          phone: '',
                          isPrimary: (current.contacts?.length ?? 0) === 0,
                          isActive: true,
                        },
                      ],
                    }))
                  }
                >
                  Add contact
                </Button>
              </ToolbarGroup>
            </Toolbar>
            {(form.contacts ?? []).length === 0 ? (
              <EmptyState
                title="No contacts yet"
                description="Add at least one customer-facing contact so quote and order snapshots have a sensible default."
              />
            ) : (
              (form.contacts ?? []).map((contact, index) => (
                <Panel
                  key={`${contact.name}-${index}`}
                  title={contact.name || `Contact ${index + 1}`}
                  compactHeader
                  actions={
                    <Button
                      tone="danger"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          contacts: (current.contacts ?? []).filter((_, contactIndex) => contactIndex !== index),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  }
                >
                  <FormGrid columns={2}>
                    <Field label="Name">
                      <input
                        className="control"
                        value={contact.name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            contacts: (current.contacts ?? []).map((candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, name: event.target.value }
                                : candidate,
                            ),
                          }))
                        }
                      />
                    </Field>
                    <Field label="Job Title">
                      <input
                        className="control"
                        value={contact.jobTitle ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            contacts: (current.contacts ?? []).map((candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, jobTitle: event.target.value }
                                : candidate,
                            ),
                          }))
                        }
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        className="control"
                        value={contact.email ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            contacts: (current.contacts ?? []).map((candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, email: event.target.value }
                                : candidate,
                            ),
                          }))
                        }
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        className="control"
                        value={contact.phone ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            contacts: (current.contacts ?? []).map((candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, phone: event.target.value }
                                : candidate,
                            ),
                          }))
                        }
                      />
                    </Field>
                    <Field label="Primary Contact">
                      <select
                        className="control"
                        value={contact.isPrimary ? 'yes' : 'no'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            contacts: (current.contacts ?? []).map((candidate, candidateIndex) => ({
                              ...candidate,
                              isPrimary:
                                candidateIndex === index ? event.target.value === 'yes' : false,
                            })),
                          }))
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </Field>
                    <Field label="Active">
                      <select
                        className="control"
                        value={contact.isActive === false ? 'inactive' : 'active'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            contacts: (current.contacts ?? []).map((candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, isActive: event.target.value === 'active' }
                                : candidate,
                            ),
                          }))
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </Field>
                  </FormGrid>
                </Panel>
              ))
            )}
          </div>
        ) : null}

        {activeTab === 'addresses' ? (
          <div className="split-grid split-grid--balanced">
            {(['billingAddress', 'shippingAddress'] as const).map((addressKey) => (
              <Panel
                key={addressKey}
                title={addressKey === 'billingAddress' ? 'Billing address' : 'Shipping address'}
                description="These values snapshot onto quotes and sales orders when selected."
              >
                <FormGrid>
                  <Field label="Street">
                    <input
                      className="control"
                      value={form[addressKey]?.street ?? ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [addressKey]: {
                            ...current[addressKey],
                            street: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className="control"
                      value={form[addressKey]?.city ?? ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [addressKey]: {
                            ...current[addressKey],
                            city: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Postcode">
                    <input
                      className="control"
                      value={form[addressKey]?.postcode ?? ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [addressKey]: {
                            ...current[addressKey],
                            postcode: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="State / Region">
                    <input
                      className="control"
                      value={form[addressKey]?.stateRegion ?? ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [addressKey]: {
                            ...current[addressKey],
                            stateRegion: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      className="control"
                      value={form[addressKey]?.country ?? ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [addressKey]: {
                            ...current[addressKey],
                            country: event.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                </FormGrid>
              </Panel>
            ))}
          </div>
        ) : null}

        {activeTab === 'defaults' ? (
          <FormGrid columns={2}>
            <Field label="Payment Term">
              <input
                className="control"
                value={form.defaultPaymentTerm ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, defaultPaymentTerm: event.target.value }))}
              />
            </Field>
            <Field label="Shipping Term">
              <input
                className="control"
                value={form.defaultShippingTerm ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, defaultShippingTerm: event.target.value }))}
              />
            </Field>
            <Field label="Shipping Method">
              <input
                className="control"
                value={form.defaultShippingMethod ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, defaultShippingMethod: event.target.value }))}
              />
            </Field>
            <Field label="Document Discount %">
              <input
                className="control"
                type="number"
                min={0}
                step="0.01"
                value={form.defaultDocumentDiscountPercent ?? 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultDocumentDiscountPercent: Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field label="Default Tax Rate %">
              <input
                className="control"
                type="number"
                min={0}
                step="0.01"
                value={form.defaultTaxRate ?? 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultTaxRate: Number(event.target.value),
                  }))
                }
              />
            </Field>
          </FormGrid>
        ) : null}

        {activeTab === 'notes' ? (
          <Field label="Internal Notes">
            <textarea
              className="control"
              value={form.internalNotes ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))}
            />
          </Field>
        ) : null}

        {activeTab === 'documents' ? (
          customer?.documents.length ? (
            <DataTable
              columns={[
                {
                  header: 'Document',
                  cell: (document) => (
                    <div className="stack stack--tight">
                      <strong className="mono">{document.documentNumber}</strong>
                      <span className="muted-copy--small">
                        {document.kind === 'quote' ? 'Quote' : 'Sales Order'}
                      </span>
                    </div>
                  ),
                },
                {
                  header: 'Status',
                  width: '140px',
                  cell: (document) => <Badge tone="info">{document.status}</Badge>,
                },
                {
                  header: 'Promised',
                  width: '120px',
                  cell: (document) => <span className="mono">{formatDate(document.promisedDate)}</span>,
                },
                {
                  header: 'Total',
                  width: '140px',
                  align: 'right',
                  cell: (document) => <span className="mono">{formatCurrency(document.totalAmount)}</span>,
                },
                {
                  header: 'Open',
                  width: '110px',
                  cell: (document) => (
                    <Link
                      className="button button--secondary"
                      href={`/customer-orders/${workspaceIdForDocument(document.kind === 'quote' ? 'quote' : 'sales-order', document.id)}`}
                    >
                      Workspace
                    </Link>
                  ),
                },
              ]}
              rows={customer.documents}
              getRowKey={(document) => `${document.kind}-${document.id}`}
            />
          ) : (
            <EmptyState
              title="No linked documents yet"
              description="Quotes and sales orders for this customer will appear here once the commercial flow is used."
            />
          )
        ) : null}
      </Panel>
    </PageShell>
  );
}
