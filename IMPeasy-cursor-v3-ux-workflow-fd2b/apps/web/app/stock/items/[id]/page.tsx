'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageShell } from '../../../../components/ui/page-templates';
import { Badge, DataTable, EmptyState, Panel, StatCard, StatGrid, Toolbar, ToolbarGroup } from '../../../../components/ui/primitives';
import { formatDate } from '../../../../lib/commercial';
import { getStockItem } from '../../../../lib/api';
import type { StockItemDetail } from '../../../../types/inventory';

type StockItemTab = 'summary' | 'lots' | 'movements' | 'linked-docs';

export default function StockItemDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [item, setItem] = useState<StockItemDetail | null>(null);
  const [activeTab, setActiveTab] = useState<StockItemTab>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItem(await getStockItem(id));
      } catch {
        setError('Stock item not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading stock item...</p>;
  }

  if (error || !item) {
    return <p role="alert">{error ?? 'Stock item not found.'}</p>;
  }

  return (
    <PageShell
      eyebrow="Inventory"
      title={item.itemName}
      description="Summary, lot position, movement history, and linked documents for the selected stock item."
      actions={
        <>
          <Badge tone="info">{item.unitOfMeasure}</Badge>
          <Link className="button button--secondary" href="/stock/items">
            Back to stock items
          </Link>
        </>
      }
    >
      <StatGrid>
        <StatCard label="On Hand" value={item.onHandQuantity} />
        <StatCard label="Available" value={item.availableQuantity} />
        <StatCard label="Booked" value={item.bookedQuantity} />
        <StatCard label="Reorder Point" value={item.reorderPoint} />
      </StatGrid>

      <Panel title="Stock item detail" description="The item detail groups live stock context into four quick tabs.">
        <Toolbar>
          <ToolbarGroup>
            {([
              ['summary', 'Summary'],
              ['lots', 'Lots'],
              ['movements', 'Movements'],
              ['linked-docs', 'Linked Docs'],
            ] as Array<[StockItemTab, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`workspace-tab${activeTab === value ? ' workspace-tab--active' : ''}`}
                onClick={() => setActiveTab(value)}
              >
                {label}
              </button>
            ))}
          </ToolbarGroup>
        </Toolbar>

        {activeTab === 'summary' ? (
          <DataTable
            columns={[
              { header: 'Field', width: '180px', cell: (row) => row.label },
              { header: 'Value', cell: (row) => row.value },
            ]}
            rows={[
              { id: 'code', label: 'Item Code', value: item.itemCode ?? `Item ${item.itemId}` },
              { id: 'uom', label: 'Unit of Measure', value: item.unitOfMeasure },
              { id: 'expected', label: 'Expected', value: item.expectedQuantity },
              { id: 'wip', label: 'WIP', value: item.wipQuantity },
            ]}
            getRowKey={(row) => row.id}
          />
        ) : null}

        {activeTab === 'lots' ? (
          <DataTable
            columns={[
              {
                header: 'Lot',
                cell: (lot) => (
                  <div className="stack stack--tight">
                    <Link href={`/stock/lots/${lot.id}`} className="mono">
                      {lot.lotNumber}
                    </Link>
                    <span className="muted-copy--small">{lot.sourceDocument ?? '-'}</span>
                  </div>
                ),
              },
              { header: 'Quantity', width: '90px', align: 'right', cell: (lot) => lot.quantityOnHand },
              { header: 'Available', width: '90px', align: 'right', cell: (lot) => lot.availableQuantity },
              { header: 'Status', width: '120px', cell: (lot) => <Badge tone="info">{lot.status}</Badge> },
            ]}
            rows={item.lots}
            getRowKey={(lot) => String(lot.id)}
            emptyState={<EmptyState title="No lots" description="Lots will appear after receipts or Manufacturing Order completion." />}
          />
        ) : null}

        {activeTab === 'movements' ? (
          <DataTable
            columns={[
              { header: 'Date', width: '130px', cell: (movement) => formatDate(movement.transactionDate) },
              { header: 'Lot', width: '120px', cell: (movement) => movement.lotNumber ?? '-' },
              { header: 'Type', width: '140px', cell: (movement) => movement.movementType },
              { header: 'Quantity', width: '90px', align: 'right', cell: (movement) => movement.quantity },
              { header: 'Reference', cell: (movement) => movement.reference ?? '-' },
            ]}
            rows={item.movements}
            getRowKey={(movement) => String(movement.id)}
            emptyState={<EmptyState title="No movements" description="Movement history will appear as this item is received, booked, picked, or shipped." />}
          />
        ) : null}

        {activeTab === 'linked-docs' ? (
          <DataTable
            columns={[
              { header: 'Kind', width: '140px', cell: (document) => document.kind },
              { header: 'Reference', cell: (document) => document.reference },
            ]}
            rows={item.linkedDocuments}
            getRowKey={(document) => `${document.kind}-${document.reference}`}
            emptyState={<EmptyState title="No linked documents" description="Source documents and movement references will show up here as the item is used." />}
          />
        ) : null}
      </Panel>
    </PageShell>
  );
}
