'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ListTemplate } from '../../../components/ui/page-templates';
import { Badge, EmptyState } from '../../../components/ui/primitives';
import { listStockItems } from '../../../lib/api';
import type { StockItem } from '../../../types/inventory';

export default function StockItemsPage(): JSX.Element {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listStockItems());
      } catch {
        setError('Unable to load stock items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading stock items...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <ListTemplate
      eyebrow="Inventory"
      title="Stock Items"
      description="One-line stock view across on hand, available, booked, expected, and WIP quantities."
      actions={<Link className="button button--secondary" href="/stock/critical-on-hand">Critical on-hand</Link>}
      tableTitle="Stock item list"
      tableDescription="Start here when you need the current position for a stocked item."
      table={{
        columns: [
          {
            header: 'Item',
            cell: (item) => (
              <div className="stack stack--tight">
                <Link href={`/stock/items/${item.itemId}`} className="mono">
                  {item.itemCode ?? `Item ${item.itemId}`}
                </Link>
                <strong>{item.itemName}</strong>
              </div>
            ),
          },
          { header: 'On Hand', width: '90px', align: 'right', cell: (item) => item.onHandQuantity },
          { header: 'Available', width: '90px', align: 'right', cell: (item) => item.availableQuantity },
          { header: 'Booked', width: '90px', align: 'right', cell: (item) => item.bookedQuantity },
          { header: 'Expected', width: '90px', align: 'right', cell: (item) => item.expectedQuantity },
          { header: 'WIP', width: '90px', align: 'right', cell: (item) => item.wipQuantity },
          {
            header: 'Reorder Point',
            width: '110px',
            align: 'right',
            cell: (item) => item.reorderPoint,
          },
        ],
        rows: items,
        getRowKey: (item) => String(item.itemId),
        emptyState: (
          <EmptyState
            title="No stock items"
            description="Stock item summaries will appear here once lots, receipts, or reorder points exist."
          />
        ),
      }}
      aside={
        <>
          <Badge tone="info">Lot-first</Badge>
          <p className="muted-copy">
            Available quantity already accounts for active manufacturing bookings and draft or picked
            shipment allocations.
          </p>
        </>
      }
    />
  );
}
