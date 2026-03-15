'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageShell } from '../../../../components/ui/page-templates';
import { Badge, DataTable, EmptyState, Panel, StatCard, StatGrid } from '../../../../components/ui/primitives';
import { formatDate } from '../../../../lib/commercial';
import { getStockLot } from '../../../../lib/api';
import type { StockLotDetail } from '../../../../types/inventory';

export default function StockLotDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [lot, setLot] = useState<StockLotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLot(await getStockLot(id));
      } catch {
        setError('Stock lot not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading stock lot...</p>;
  }

  if (error || !lot) {
    return <p role="alert">{error ?? 'Stock lot not found.'}</p>;
  }

  return (
    <PageShell
      eyebrow="Inventory"
      title={lot.lotNumber}
      description="Lot detail with source, reservation, and note context."
      actions={
        <>
          <Badge tone="info">{lot.status}</Badge>
          <Link className="button button--secondary" href="/stock/lots">
            Back to lots
          </Link>
        </>
      }
    >
      <StatGrid>
        <StatCard label="Item" value={lot.itemName} hint={lot.itemCode ?? `Item ${lot.itemId}`} />
        <StatCard label="Quantity" value={lot.quantityOnHand} />
        <StatCard label="Reserved" value={lot.reservedQuantity} />
        <StatCard label="Available" value={lot.availableQuantity} />
      </StatGrid>

      <Panel title="Lot detail" description="Reservations show which Manufacturing Orders or shipments currently consume this lot's availability.">
        <DataTable
          columns={[
            { header: 'Field', width: '180px', cell: (row) => row.label },
            { header: 'Value', cell: (row) => row.value },
          ]}
          rows={[
            { id: 'source', label: 'Source Document', value: lot.sourceDocument ?? '-' },
            { id: 'received', label: 'Received / Produced', value: formatDate(lot.receivedOrProducedAt) },
            { id: 'notes', label: 'Notes', value: lot.notes ?? '-' },
          ]}
          getRowKey={(row) => row.id}
        />

        <Panel title="Reservations" description="Active reservations block quantity from shipping or further booking.">
          <DataTable
            columns={[
              { header: 'Kind', width: '160px', cell: (reservation) => reservation.kind },
              { header: 'Reference', cell: (reservation) => reservation.reference },
              { header: 'Quantity', width: '90px', align: 'right', cell: (reservation) => reservation.quantity },
            ]}
            rows={lot.reservations}
            getRowKey={(reservation) => `${reservation.kind}-${reservation.reference}`}
            emptyState={<EmptyState title="No reservations" description="This lot is currently free for manufacturing booking or shipment picking." />}
          />
        </Panel>
      </Panel>
    </PageShell>
  );
}
