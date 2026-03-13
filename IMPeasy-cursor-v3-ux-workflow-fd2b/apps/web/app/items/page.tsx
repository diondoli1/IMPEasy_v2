'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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
    <section>
      <h1>Items</h1>
      <p>
        <Link href="/items/new">Create item</Link>
      </p>
      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Name</th>
              <th align="left">Description</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/items/${item.id}`}>{item.id}</Link>
                </td>
                <td>{item.name}</td>
                <td>{item.description ?? '-'}</td>
                <td>{item.isActive ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
