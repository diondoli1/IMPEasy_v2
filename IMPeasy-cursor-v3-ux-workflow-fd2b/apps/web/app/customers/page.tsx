'use client';

import React, { useEffect, useState } from 'react';

import { listCustomers } from '../../lib/api';
import { formatCurrency } from '../../lib/commercial';
import type { Customer } from '../../types/customer';
import { PageShell } from '../../components/ui/page-templates';
import {
  Badge,
  ButtonLink,
  DataTable,
  EmptyState,
  Panel,
  Toolbar,
  ToolbarGroup,
} from '../../components/ui/primitives';

export default function CustomersPage(): JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setCustomers(await listCustomers());
      } catch {
        setError('Unable to load customers.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading customers...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <PageShell
      eyebrow="Customers"
      title="Customers"
      description="Operational customer list with quick access into defaults, contacts, and linked commercial documents."
      actions={
        <>
          <ButtonLink href="/customer-orders">Customer orders</ButtonLink>
          <ButtonLink href="/customers/new" tone="primary">
            Create Customer
          </ButtonLink>
        </>
      }
    >
      <Panel title="Customer master" description="Customers stay compact but operational, with defaults ready to snapshot onto quotes and sales orders.">
        <Toolbar>
          <ToolbarGroup>
            <Badge tone="info">{customers.length} customers</Badge>
          </ToolbarGroup>
        </Toolbar>
        <DataTable
          columns={[
            {
              header: 'Customer Code',
              width: '150px',
              cell: (customer) => (
                <ButtonLink href={`/customers/${customer.id}`}>{customer.code ?? 'Uncoded'}</ButtonLink>
              ),
            },
            {
              header: 'Company Name',
              cell: (customer) => <strong>{customer.name}</strong>,
            },
            {
              header: 'Main Contact',
              cell: (customer) => customer.contacts.find((contact) => contact.isPrimary)?.name ?? '-',
            },
            {
              header: 'Phone',
              width: '140px',
              cell: (customer) => customer.phone ?? '-',
            },
            {
              header: 'Email',
              cell: (customer) => customer.email ?? '-',
            },
            {
              header: 'Status',
              width: '120px',
              cell: (customer) => (
                <Badge tone={customer.isActive ? 'success' : 'neutral'}>
                  {customer.isActive ? 'active' : 'inactive'}
                </Badge>
              ),
            },
            {
              header: 'Payment Term',
              width: '140px',
              cell: (customer) => customer.defaultPaymentTerm ?? '-',
            },
            {
              header: 'Default Discount',
              width: '150px',
              align: 'right',
              cell: (customer) => `${customer.defaultDocumentDiscountPercent.toFixed(2)}%`,
            },
            {
              header: 'Linked Value',
              width: '150px',
              align: 'right',
              cell: (customer) =>
                formatCurrency(
                  customer.documents.reduce((sum, document) => sum + document.totalAmount, 0),
                ),
            },
          ]}
          rows={customers}
          getRowKey={(customer) => String(customer.id)}
          emptyState={
            <EmptyState
              title="No customers yet"
              description="Create a customer first so the commercial board can produce real snapshot defaults and document links."
              action={<ButtonLink href="/customers/new" tone="primary">Create Customer</ButtonLink>}
            />
          }
        />
      </Panel>
    </PageShell>
  );
}
