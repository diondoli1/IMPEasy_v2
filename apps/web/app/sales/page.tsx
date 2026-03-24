'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { PageShell } from '../../components/ui/page-templates';
import { DataTable, EmptyState, Panel, StatCard, StatGrid } from '../../components/ui/primitives';
import { getSalesReport } from '../../lib/api';
import type { SalesReportResponse } from '../../types/sales-order';

const SUMMARY_CARDS: Array<{
  label: string;
  key: keyof SalesReportResponse['summary'];
}> = [
  { label: 'Total Sales Orders', key: 'totalSalesOrders' },
  { label: 'Ordered Quantity', key: 'totalOrderedQuantity' },
  { label: 'Ordered Amount', key: 'totalOrderedAmount' },
  { label: 'Shipped Quantity', key: 'totalShippedQuantity' },
  { label: 'Shipped Amount', key: 'totalShippedAmount' },
  { label: 'Issued Invoice Amount', key: 'totalInvoiceIssuedAmount' },
  { label: 'Paid Invoice Amount', key: 'totalInvoicePaidAmount' },
  { label: 'Outstanding Amount', key: 'totalOutstandingInvoiceAmount' },
];

function formatUpdatedAt(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function SalesPage(): JSX.Element {
  const [report, setReport] = useState<SalesReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getSalesReport();
        setReport(data);
      } catch {
        setError('Unable to load sales report.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading sales report...</p>;
  }

  if (error || !report) {
    return <p role="alert">{error ?? 'Unable to load sales report.'}</p>;
  }

  return (
    <PageShell
      eyebrow="Sales"
      title="Sales report"
      description="Read-only commercial dashboard for ordered, shipped, invoiced, paid, and outstanding sales metrics."
    >
      <StatGrid>
        {SUMMARY_CARDS.map((card) => (
          <StatCard key={card.key} label={card.label} value={report.summary[card.key]} />
        ))}
      </StatGrid>
      {report.orders.length === 0 ? (
        <EmptyState title="No sales orders found" description="Sales report rows will appear when orders are created." />
      ) : (
        <Panel title="Orders">
          <DataTable
            columns={[
              {
                header: 'Order',
                cell: (order) => (
                  <div className="stack stack--tight">
                    <Link href={`/sales-orders/${order.salesOrderId}`}>Sales order #{order.salesOrderId}</Link>
                    <span className="muted-copy--small">Quote #{order.quoteId}</span>
                  </div>
                ),
              },
              { header: 'Customer', cell: (order) => order.customerName },
              { header: 'Status', cell: (order) => order.salesOrderStatus },
              { header: 'Ordered', cell: (order) => `Qty ${order.orderedQuantity} / Amount ${order.orderedAmount}` },
              { header: 'Shipped', cell: (order) => `Qty ${order.shippedQuantity} / Amount ${order.shippedAmount}` },
              {
                header: 'Invoices',
                cell: (order) =>
                  `Issued ${order.invoiceIssuedAmount} / Paid ${order.invoicePaidAmount} / Outstanding ${order.outstandingInvoiceAmount}`,
              },
              {
                header: 'Shipment Counts',
                cell: (order) =>
                  `Total ${order.shipmentCount} / Delivered ${order.deliveredShipmentCount} / Issued ${order.invoiceIssuedCount} / Paid ${order.invoicePaidCount}`,
              },
              { header: 'Updated', cell: (order) => formatUpdatedAt(order.updatedAt) },
            ]}
            rows={report.orders}
            getRowKey={(order) => String(order.salesOrderId)}
          />
        </Panel>
      )}
    </PageShell>
  );
}
