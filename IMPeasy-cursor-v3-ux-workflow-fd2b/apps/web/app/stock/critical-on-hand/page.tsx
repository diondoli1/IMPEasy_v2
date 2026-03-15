'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ListTemplate } from '../../../components/ui/page-templates';
import { Badge, EmptyState } from '../../../components/ui/primitives';
import { listCriticalOnHand } from '../../../lib/api';
import type { CriticalOnHandItem } from '../../../types/inventory';

export default function CriticalOnHandPage(): JSX.Element {
  const [items, setItems] = useState<CriticalOnHandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listCriticalOnHand());
      } catch {
        setError('Unable to load the critical on-hand view.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading critical on-hand...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <ListTemplate
      eyebrow="Inventory"
      title="Critical On-Hand"
      description="Shortage-focused stock review for office and planner users."
      actions={<Link className="button button--secondary" href="/stock/items">Back to stock items</Link>}
      tableTitle="Shortage review"
      tableDescription="Items surface here when available quantity hits or falls below the reorder point."
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
          { header: 'Reorder Point', width: '110px', align: 'right', cell: (item) => item.reorderPoint },
          {
            header: 'State',
            width: '120px',
            cell: (item) => (
              <Badge tone={item.shortageState === 'critical' ? 'danger' : item.shortageState === 'warning' ? 'warning' : 'success'}>
                {item.shortageState}
              </Badge>
            ),
          },
        ],
        rows: items,
        getRowKey: (item) => String(item.itemId),
        emptyState: <EmptyState title="No shortages" description="Items at or below reorder point will appear here." />,
      }}
    />
  );
}
