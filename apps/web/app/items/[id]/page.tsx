'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ItemRoutingLinks } from '../../../components/item-routing-links';
import { ItemForm } from '../../../components/item-form';
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
    <section>
      <h1>Item #{item.id}</h1>
      <p>
        <Link href="/items">Back to items</Link>
      </p>
      <ItemForm
        initial={item}
        submitLabel="Update item"
        onSubmit={async (payload) => {
          const updated = await updateItem(id, payload);
          setItem(updated);
        }}
      />
      <hr style={{ margin: '24px 0' }} />
      <h2>Routing Linkage</h2>
      <p>Default routing ID: {item.defaultRoutingId ?? '-'}</p>
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
    </section>
  );
}
