'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ItemForm } from '../../../components/item-form';
import { createItem } from '../../../lib/api';

export default function NewItemPage(): JSX.Element {
  const router = useRouter();

  return (
    <section>
      <h1>Create Item</h1>
      <p>
        <Link href="/items">Back to items</Link>
      </p>
      <ItemForm
        submitLabel="Create item"
        onSubmit={async (payload) => {
          const item = await createItem(payload);
          router.push(`/items/${item.id}`);
        }}
      />
    </section>
  );
}
