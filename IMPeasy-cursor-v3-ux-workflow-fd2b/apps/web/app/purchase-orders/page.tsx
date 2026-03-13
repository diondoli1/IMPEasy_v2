'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { formatDate } from '../../lib/commercial';
import { listPurchaseOrders } from '../../lib/api';
import type { PurchaseOrder } from '../../types/purchase-order';
import { Badge, DataTable, EmptyState } from '../../components/ui/primitives';

export default function PurchaseOrdersPage(): JSX.Element {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await listPurchaseOrders();
        setPurchaseOrders(data);
      } catch {
        setError('Unable to load purchase orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p>Loading purchase orders...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section>
      <h1>Purchase Orders</h1>
      <p>
        <Link href="/purchase-orders/new">Create purchase order</Link>
      </p>
      {purchaseOrders.length === 0 ? (
        <p>No purchase orders found.</p>
      ) : (
        <DataTable
          columns={[
            {
              header: 'PO',
              cell: (purchaseOrder) => (
                <div className="stack stack--tight">
                  <Link href={`/purchase-orders/${purchaseOrder.id}`} className="mono">
                    {purchaseOrder.number}
                  </Link>
                  <span className="muted-copy--small">{purchaseOrder.supplierName}</span>
                </div>
              ),
            },
            { header: 'Status', width: '110px', cell: (purchaseOrder) => <Badge tone="info">{purchaseOrder.status}</Badge> },
            { header: 'Order Date', width: '120px', cell: (purchaseOrder) => formatDate(purchaseOrder.orderDate) },
            { header: 'Expected', width: '120px', cell: (purchaseOrder) => formatDate(purchaseOrder.expectedDate) },
            { header: 'Buyer', width: '160px', cell: (purchaseOrder) => purchaseOrder.buyer ?? '-' },
            { header: 'Open Qty', width: '90px', align: 'right', cell: (purchaseOrder) => purchaseOrder.openQuantity },
            { header: 'Received', width: '90px', align: 'right', cell: (purchaseOrder) => purchaseOrder.receivedQuantity },
          ]}
          rows={purchaseOrders}
          getRowKey={(purchaseOrder) => String(purchaseOrder.id)}
          emptyState={
            <EmptyState
              title="No purchase orders"
              description="Create the first purchase order to start receiving stock into lots."
            />
          }
        />
      )}
    </section>
  );
}
