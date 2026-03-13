'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageShell } from '../../../components/ui/page-templates';
import { Badge, DataTable, EmptyState, Panel, StatCard, StatGrid } from '../../../components/ui/primitives';
import { formatCurrency, formatDate } from '../../../lib/commercial';
import { getInvoice } from '../../../lib/api';
import type { Invoice } from '../../../types/invoice';

export default function InvoiceDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setInvoice(await getInvoice(id));
      } catch {
        setError('Invoice not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading invoice...</p>;
  }

  if (error || !invoice) {
    return <p role="alert">{error ?? 'Invoice not found.'}</p>;
  }

  return (
    <PageShell
      eyebrow="Invoicing"
      title={invoice.number}
      description="Operational invoice detail linked to its source shipment and sales order."
      actions={
        <>
          <Badge tone={invoice.status === 'paid' ? 'success' : 'info'}>{invoice.status}</Badge>
          <Link className="button button--secondary" href="/invoices">
            Back to invoices
          </Link>
        </>
      }
    >
      <StatGrid>
        <StatCard label="Customer" value={invoice.customerName} />
        <StatCard label="Sales Order" value={invoice.salesOrderNumber} />
        <StatCard label="Shipment" value={invoice.shipmentNumber} />
        <StatCard label="Total" value={formatCurrency(invoice.totalAmount)} />
      </StatGrid>

      <Panel title="Invoice header" description="Header fields keep this slice operational without entering accounting-specific scope.">
        <DataTable
          columns={[
            { header: 'Field', width: '180px', cell: (row) => row.label },
            { header: 'Value', cell: (row) => row.value },
          ]}
          rows={[
            { id: 'issue', label: 'Issue Date', value: formatDate(invoice.issueDate) },
            { id: 'due', label: 'Due Date', value: formatDate(invoice.dueDate) },
            { id: 'paid', label: 'Paid Date', value: formatDate(invoice.paidAt) },
          ]}
          getRowKey={(row) => row.id}
        />
      </Panel>

      <Panel title="Invoice lines" description="Line breakdown stays tied to the shipment lines that generated the invoice.">
        <DataTable
          columns={[
            {
              header: 'Item',
              cell: (line) => (
                <div className="stack stack--tight">
                  <strong>{line.itemName}</strong>
                  <span className="muted-copy--small mono">{line.itemCode ?? `Item ${line.itemId}`}</span>
                </div>
              ),
            },
            { header: 'Quantity', width: '90px', align: 'right', cell: (line) => line.quantity },
            { header: 'Unit Price', width: '110px', align: 'right', cell: (line) => formatCurrency(line.unitPrice) },
            { header: 'Line Total', width: '110px', align: 'right', cell: (line) => formatCurrency(line.lineTotal) },
          ]}
          rows={invoice.invoiceLines}
          getRowKey={(line) => String(line.id)}
          emptyState={<EmptyState title="No lines" description="Invoice lines will appear when shipment lines are invoiced." />}
        />
      </Panel>
    </PageShell>
  );
}
