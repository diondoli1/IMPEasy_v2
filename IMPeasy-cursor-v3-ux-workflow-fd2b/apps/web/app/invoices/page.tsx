'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ListTemplate } from '../../components/ui/page-templates';
import { Badge, EmptyState } from '../../components/ui/primitives';
import { formatCurrency, formatDate } from '../../lib/commercial';
import { listInvoices } from '../../lib/api';
import type { InvoiceRegisterEntry } from '../../types/invoice';

export default function InvoicesPage(): JSX.Element {
  const [invoices, setInvoices] = useState<InvoiceRegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setInvoices(await listInvoices());
      } catch {
        setError('Unable to load invoices.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading invoice register...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <ListTemplate
      eyebrow="Invoicing"
      title="Invoice Register"
      description="Operational invoice register linked directly to delivered shipments."
      tableTitle="Issued invoices"
      tableDescription="Use the register to check issue, due, and paid dates without entering full accounting scope."
      table={{
        columns: [
          {
            header: 'Invoice',
            cell: (invoice) => (
              <div className="stack stack--tight">
                <Link href={`/invoices/${invoice.id}`} className="mono">
                  {invoice.number}
                </Link>
                <span className="muted-copy--small">{invoice.customerName}</span>
              </div>
            ),
          },
          { header: 'Sales Order', width: '120px', cell: (invoice) => invoice.salesOrderNumber },
          { header: 'Shipment', width: '120px', cell: (invoice) => invoice.shipmentNumber },
          { header: 'Status', width: '110px', cell: (invoice) => <Badge tone={invoice.status === 'paid' ? 'success' : 'info'}>{invoice.status}</Badge> },
          { header: 'Total', width: '110px', align: 'right', cell: (invoice) => formatCurrency(invoice.totalAmount) },
          { header: 'Issue Date', width: '120px', cell: (invoice) => formatDate(invoice.issueDate) },
          { header: 'Due Date', width: '120px', cell: (invoice) => formatDate(invoice.dueDate) },
          { header: 'Paid Date', width: '120px', cell: (invoice) => formatDate(invoice.paidAt) },
        ],
        rows: invoices,
        getRowKey: (invoice) => String(invoice.id),
        emptyState: <EmptyState title="No invoices" description="Invoices appear here after delivered shipments are invoiced." />,
      }}
    />
  );
}
