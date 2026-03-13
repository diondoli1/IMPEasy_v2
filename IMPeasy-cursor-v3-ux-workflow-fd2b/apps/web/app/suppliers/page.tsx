'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { listSuppliers } from '../../lib/api';
import type { Supplier } from '../../types/supplier';
import { Badge, DataTable, EmptyState } from '../../components/ui/primitives';

export default function SuppliersPage(): JSX.Element {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await listSuppliers();
        setSuppliers(data);
      } catch {
        setError('Unable to load suppliers.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading suppliers...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h1>Suppliers</h1>
      <p>
        <Link href="/suppliers/new">Create supplier</Link>
      </p>
      {suppliers.length === 0 ? (
        <p>No suppliers found.</p>
      ) : (
        <DataTable
          columns={[
            {
              header: 'Supplier',
              cell: (supplier) => (
                <div className="stack stack--tight">
                  <Link href={`/suppliers/${supplier.id}`} className="mono">
                    {supplier.code ?? `SUP-${String(supplier.id).padStart(4, '0')}`}
                  </Link>
                  <strong>{supplier.name}</strong>
                </div>
              ),
            },
            {
              header: 'Phone / Email',
              cell: (supplier) => (
                <div className="stack stack--tight">
                  <span>{supplier.phone ?? '-'}</span>
                  <span className="muted-copy--small">{supplier.email ?? '-'}</span>
                </div>
              ),
            },
            {
              header: 'Active',
              width: '110px',
              cell: (supplier) => (
                <Badge tone={supplier.isActive ? 'success' : 'warning'}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
          ]}
          rows={suppliers}
          getRowKey={(supplier) => String(supplier.id)}
          emptyState={
            <EmptyState
              title="No vendors yet"
              description="Create the first supplier to start managing item terms and purchase orders."
            />
          }
        />
      )}
    </section>
  );
}
