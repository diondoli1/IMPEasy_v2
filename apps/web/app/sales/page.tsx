'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

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
    <section>
      <h1>Sales Report</h1>
      <p>
        Read-only commercial dashboard for ordered, shipped, invoiced, paid, and outstanding sales
        metrics.
      </p>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          marginBottom: 24,
        }}
      >
        {SUMMARY_CARDS.map((card) => (
          <article
            key={card.key}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>{card.label}</p>
            <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>
              {report.summary[card.key]}
            </strong>
          </article>
        ))}
      </div>
      {report.orders.length === 0 ? (
        <p>No sales orders found.</p>
      ) : (
        <table
          cellPadding={8}
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
          }}
        >
          <thead style={{ background: '#e2e8f0' }}>
            <tr>
              <th align="left">Order</th>
              <th align="left">Customer</th>
              <th align="left">Status</th>
              <th align="left">Ordered</th>
              <th align="left">Shipped</th>
              <th align="left">Invoices</th>
              <th align="left">Shipment Counts</th>
              <th align="left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {report.orders.map((order) => (
              <tr key={order.salesOrderId} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td>
                  <Link href={`/sales-orders/${order.salesOrderId}`}>
                    Sales order #{order.salesOrderId}
                  </Link>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Quote #{order.quoteId}</div>
                </td>
                <td>{order.customerName}</td>
                <td>{order.salesOrderStatus}</td>
                <td>
                  Qty {order.orderedQuantity} / Amount {order.orderedAmount}
                </td>
                <td>
                  Qty {order.shippedQuantity} / Amount {order.shippedAmount}
                </td>
                <td>
                  Issued {order.invoiceIssuedAmount} / Paid {order.invoicePaidAmount} / Outstanding{' '}
                  {order.outstandingInvoiceAmount}
                </td>
                <td>
                  Total {order.shipmentCount} / Delivered {order.deliveredShipmentCount} / Invoices
                  {' '}Issued {order.invoiceIssuedCount} / Paid {order.invoicePaidCount}
                </td>
                <td>{formatUpdatedAt(order.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
