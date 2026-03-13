'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { RoutingForm } from '../../../components/routing-form';
import { createRouting, listItems } from '../../../lib/api';
import type { Item } from '../../../types/item';

export default function NewRoutingPage(): JSX.Element {
  const router = useRouter();
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
    <section>
      <h1>Create Routing</h1>
      <p>
        <Link href="/items">Back to items</Link>
      </p>
      <RoutingForm
        items={items.map((item) => ({ id: item.id, name: item.name }))}
        submitLabel="Create routing"
        onSubmit={async (payload) => {
          const routing = await createRouting(payload);
          router.push(`/routings/${routing.id}`);
        }}
      />
    </section>
  );
}
