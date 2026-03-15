'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { getInventorySummaryReport } from '../../lib/api';
import type { InventorySummaryReportResponse } from '../../types/inventory';

const SUMMARY_CARDS: Array<{
  label: string;
  key: keyof InventorySummaryReportResponse['summary'];
}> = [
  { label: 'Tracked Items', key: 'totalTrackedItems' },
  { label: 'On Hand Quantity', key: 'totalOnHandQuantity' },
  { label: 'Received Quantity', key: 'totalReceivedQuantity' },
  { label: 'Issued Quantity', key: 'totalIssuedQuantity' },
  { label: 'Adjustment Quantity', key: 'totalAdjustmentQuantity' },
  { label: 'Returned Quantity', key: 'totalReturnedQuantity' },
  { label: 'PO Ordered Quantity', key: 'totalPurchaseOrderedQuantity' },
  { label: 'PO Received Quantity', key: 'totalPurchaseReceivedQuantity' },
  { label: 'PO Open Quantity', key: 'totalPurchaseOpenQuantity' },
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

export default function InventorySummaryPage(): JSX.Element {
  const [dashboard, setDashboard] = useState<InventorySummaryReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getInventorySummaryReport();
        setDashboard(data);
      } catch {
        setError('Unable to load inventory summary.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading inventory summary...</p>;
  }

  if (error || !dashboard) {
    return <p role="alert">{error ?? 'Unable to load inventory summary.'}</p>;
  }

  return (
    <section>
      <h1>Inventory Summary</h1>
      <p>
        Read-only inventory dashboard for current stock, transaction movement, and purchasing
        quantity context.
      </p>
      <p>
        <Link href="/inventory/items">Manage inventory items</Link> |{' '}
        <Link href="/purchase-orders">Review purchase orders</Link>
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
              {dashboard.summary[card.key]}
            </strong>
          </article>
        ))}
      </div>
      {dashboard.items.length === 0 ? (
        <p>No inventory items found.</p>
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
              <th align="left">Inventory</th>
              <th align="left">Item</th>
              <th align="left">On Hand</th>
              <th align="left">Transactions</th>
              <th align="left">Purchasing</th>
              <th align="left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.items.map((row) => (
              <tr key={row.inventoryItemId} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td>
                  <Link href={`/inventory/items/${row.inventoryItemId}`}>
                    Inventory #{row.inventoryItemId}
                  </Link>
                </td>
                <td>
                  <Link href={`/items/${row.itemId}`}>{row.itemName}</Link>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Item #{row.itemId}</div>
                </td>
                <td>{row.quantityOnHand}</td>
                <td>
                  Recv {row.receivedQuantity} / Issue {row.issuedQuantity} / Adj{' '}
                  {row.adjustmentQuantity} / Return {row.returnedQuantity}
                </td>
                <td>
                  Ordered {row.purchaseOrderedQuantity} / Received {row.purchaseReceivedQuantity} /
                  {' '}Open {row.purchaseOpenQuantity}
                </td>
                <td>{formatUpdatedAt(row.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
