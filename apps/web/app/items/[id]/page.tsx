'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ItemRoutingLinks } from '../../../components/item-routing-links';
import { ItemForm } from '../../../components/item-form';
import { PageShell } from '../../../components/ui/page-templates';
import { ButtonLink, Panel } from '../../../components/ui/primitives';
import { getItem, listRoutingsByItem, setRoutingAsDefault, updateItem } from '../../../lib/api';
import type { Item } from '../../../types/item';
import type { Routing } from '../../../types/routing';

export default function ItemDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [item, setItem] = useState<Item | null>(null);
  const [routings, setRoutings] = useState<Routing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [itemData, routingData] = await Promise.all([getItem(id), listRoutingsByItem(id)]);
        setItem(itemData);
        setRoutings(routingData);
      } catch {
        setError('Item not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading item...</p>;
  }

  if (error || !item) {
    return (
      <section>
        <p role="alert">{error ?? 'Item not found.'}</p>
        <p>
          <Link href="/items">Back to items</Link>
        </p>
      </section>
    );
  }

  return (
    <PageShell
      eyebrow="Stock"
      title={`Item #${item.id}`}
      description="Manage the item record and its default routing linkage."
      actions={<ButtonLink href="/items">Back to items</ButtonLink>}
    >
      <Panel title="Item details">
        <ItemForm
          initial={item}
          submitLabel="Update item"
          onSubmit={async (payload) => {
            const updated = await updateItem(id, payload);
            setItem(updated);
          }}
        />
      </Panel>
      <Panel
        title="Routing linkage"
        description={`Default routing ID: ${item.defaultRoutingId ?? '-'}`}
      >
        <ItemRoutingLinks
          itemId={item.id}
          routings={routings}
          defaultRoutingId={item.defaultRoutingId}
          onSetDefault={async (routingId) => {
            const linked = await setRoutingAsDefault(routingId);
            setItem((current) =>
              current
                ? {
                    ...current,
                    defaultRoutingId: linked.routingId,
                  }
                : current,
            );
          }}
        />
      </Panel>
    </PageShell>
  );
}
