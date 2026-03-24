'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { PageShell } from '../../components/ui/page-templates';
import { ButtonLink, DataTable, EmptyState, Panel, StatCard, StatGrid } from '../../components/ui/primitives';
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
    <PageShell
      eyebrow="Inventory"
      title="Inventory summary"
      description="Read-only inventory dashboard for current stock, transaction movement, and purchasing quantity context."
      actions={
        <>
          <ButtonLink href="/inventory/items">Manage inventory items</ButtonLink>
          <ButtonLink href="/purchase-orders">Review purchase orders</ButtonLink>
        </>
      }
    >
      <StatGrid>
        {SUMMARY_CARDS.map((card) => (
          <StatCard key={card.key} label={card.label} value={dashboard.summary[card.key]} />
        ))}
      </StatGrid>
      {dashboard.items.length === 0 ? (
        <EmptyState title="No inventory items found" description="Inventory rows will appear when items are stocked." />
      ) : (
        <Panel title="Inventory items">
          <DataTable
            columns={[
              {
                header: 'Inventory',
                cell: (row) => (
                  <Link href={`/inventory/items/${row.inventoryItemId}`}>Inventory #{row.inventoryItemId}</Link>
                ),
              },
              {
                header: 'Item',
                cell: (row) => (
                  <div className="stack stack--tight">
                    <Link href={`/items/${row.itemId}`}>{row.itemName}</Link>
                    <span className="muted-copy--small">Item #{row.itemId}</span>
                  </div>
                ),
              },
              { header: 'On Hand', cell: (row) => row.quantityOnHand },
              {
                header: 'Transactions',
                cell: (row) =>
                  `Recv ${row.receivedQuantity} / Issue ${row.issuedQuantity} / Adj ${row.adjustmentQuantity} / Return ${row.returnedQuantity}`,
              },
              {
                header: 'Purchasing',
                cell: (row) =>
                  `Ordered ${row.purchaseOrderedQuantity} / Received ${row.purchaseReceivedQuantity} / Open ${row.purchaseOpenQuantity}`,
              },
              { header: 'Updated', cell: (row) => formatUpdatedAt(row.updatedAt) },
            ]}
            rows={dashboard.items}
            getRowKey={(row) => String(row.inventoryItemId)}
          />
        </Panel>
      )}
    </PageShell>
  );
}
