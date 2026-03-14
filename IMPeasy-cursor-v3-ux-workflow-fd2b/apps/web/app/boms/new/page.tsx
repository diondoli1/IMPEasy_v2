'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BomForm } from '../../../components/bom-form';
import { createBom, listItems } from '../../../lib/api';
import type { Item } from '../../../types/item';

export default function NewBomPage(): JSX.Element {
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
      <h1>Create BOM</h1>
      <p>
        <Link href="/items">Back to items</Link>
      </p>
      <BomForm
        items={items.map((item) => ({ id: item.id, name: item.name }))}
        submitLabel="Create BOM"
        onSubmit={async (payload) => {
          const bom = await createBom(payload);
          router.replace(`/boms/${bom.id}`);
        }}
      />
    </section>
  );
}
