'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ListTemplate } from '../../../components/ui/page-templates';
import { Badge, ButtonLink, EmptyState } from '../../../components/ui/primitives';
import { listStockLots } from '../../../lib/api';
import type { StockLot } from '../../../types/inventory';

export default function StockLotsPage(): JSX.Element {
  const [lots, setLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLots(await listStockLots());
      } catch {
        setError('Unable to load stock lots.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading stock lots...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <ListTemplate
      eyebrow="Inventory"
      title="Stock Lots"
      description="Lot-first traceability across received and produced stock."
      actions={<ButtonLink href="/stock/items" tone="secondary">Stock items</ButtonLink>}
      tableTitle="Lot list"
      tableDescription="Lots stay visible across receiving, booking, picking, and shipment issue."
      table={{
        columns: [
          {
            header: 'Lot Number',
            width: '160px',
            cell: (lot) => (
              <Link href={`/stock/lots/${lot.id}`} className="table-link mono">
                {lot.lotNumber}
              </Link>
            ),
          },
          {
            header: 'Item',
            cell: (lot) => (
              <span className="muted-copy--small">{lot.itemName}</span>
            ),
          },
          { header: 'Source', width: '140px', cell: (lot) => lot.sourceDocument ?? '-' },
          { header: 'Quantity', width: '90px', align: 'right', cell: (lot) => lot.quantityOnHand },
          { header: 'Available', width: '90px', align: 'right', cell: (lot) => lot.availableQuantity },
          { header: 'Status', width: '120px', cell: (lot) => <Badge tone="info">{lot.status}</Badge> },
        ],
        rows: lots,
        getRowKey: (lot) => String(lot.id),
        renderRowActions: (lot) => (
          <ButtonLink href={`/stock/lots/${lot.id}`} tone="ghost">
            View
          </ButtonLink>
        ),
        emptyState: <EmptyState title="No lots" description="Lots will show here as soon as stock is received or produced." />,
      }}
    />
  );
}
