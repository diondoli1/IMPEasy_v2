'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageShell } from '../../components/ui/page-templates';
import { Badge, ButtonLink, DataTable, EmptyState, Panel } from '../../components/ui/primitives';
import { listItems } from '../../lib/api';
import type { Item } from '../../types/item';

export default function ItemsPage(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await listItems();
        setItems(data);
      } catch {
        setError('Unable to load items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading items...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <PageShell
      eyebrow="Stock"
      title="Items"
      actions={<ButtonLink href="/items/new">Create item</ButtonLink>}
    >
      {items.length === 0 ? (
        <EmptyState title="No items found" description="Create your first item to populate this list." />
      ) : (
        <Panel title="Item list">
          <DataTable
            columns={[
              { header: 'ID', cell: (item) => <Link href={`/items/${item.id}`}>{item.id}</Link> },
              { header: 'Name', cell: (item) => item.name },
              { header: 'Description', cell: (item) => item.description ?? '-' },
              {
                header: 'Status',
                cell: (item) => (
                  <Badge tone={item.isActive ? 'success' : 'warning'}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                ),
              },
            ]}
            rows={items}
            getRowKey={(item) => String(item.id)}
          />
        </Panel>
      )}
    </PageShell>
  );
}
