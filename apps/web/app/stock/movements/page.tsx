'use client';

import { useEffect, useState } from 'react';

import { ListTemplate } from '../../../components/ui/page-templates';
import { EmptyState } from '../../../components/ui/primitives';
import { formatDate } from '../../../lib/commercial';
import { listStockMovements } from '../../../lib/api';
import type { StockMovement } from '../../../types/inventory';

export default function StockMovementsPage(): JSX.Element {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setMovements(await listStockMovements());
      } catch {
        setError('Unable to load stock movements.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading stock movements...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <ListTemplate
      eyebrow="Inventory"
      title="Stock Movements"
      description="Movement ledger across receipts, material consumption, finished output, picks, and shipment issue."
      tableTitle="Movement ledger"
      tableDescription="Use the ledger when you need date-ordered traceability rather than current stock position."
      table={{
        columns: [
          { header: 'Date', width: '130px', cell: (movement) => formatDate(movement.transactionDate) },
          {
            header: 'Item',
            cell: (movement) => (
              <div className="stack stack--tight">
                <strong>{movement.itemName}</strong>
                <span className="muted-copy--small mono">{movement.itemCode ?? `Item ${movement.itemId}`}</span>
              </div>
            ),
          },
          { header: 'Lot', width: '120px', cell: (movement) => movement.lotNumber ?? '-' },
          { header: 'Type', width: '160px', cell: (movement) => movement.movementType },
          { header: 'Quantity', width: '90px', align: 'right', cell: (movement) => movement.quantity },
          { header: 'Reference', cell: (movement) => movement.reference ?? '-' },
        ],
        rows: movements,
        getRowKey: (movement) => String(movement.id),
        emptyState: <EmptyState title="No movements" description="Movements will populate after receipts, manufacturing output, and shipment activity." />,
      }}
    />
  );
}
