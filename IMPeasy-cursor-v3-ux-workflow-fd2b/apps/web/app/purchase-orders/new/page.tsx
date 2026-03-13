'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PurchaseOrderForm } from '../../../components/purchase-order-form';
import { createPurchaseOrder, listSuppliers } from '../../../lib/api';
import type { Supplier } from '../../../types/supplier';

export default function NewPurchaseOrderPage(): JSX.Element {
  const router = useRouter();
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
      <h1>Create Purchase Order</h1>
      <p>
        <Link href="/purchase-orders">Back to purchase orders</Link>
      </p>
      <PurchaseOrderForm
        suppliers={suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))}
        submitLabel="Create purchase order"
        onSubmit={async (payload) => {
          const purchaseOrder = await createPurchaseOrder(payload);
          router.push(`/purchase-orders/${purchaseOrder.id}`);
        }}
      />
    </section>
  );
}
