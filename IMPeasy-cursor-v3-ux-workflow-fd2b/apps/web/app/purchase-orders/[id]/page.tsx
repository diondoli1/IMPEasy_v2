'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PurchaseOrderDetailView } from '../../../components/purchase-order-detail-view';
import {
  createPurchaseOrderLine,
  getPurchaseOrder,
  listItems,
  listStockLots,
  receivePurchaseOrderLine,
} from '../../../lib/api';
import type { StockLot } from '../../../types/inventory';
import type { Item } from '../../../types/item';
import type { PurchaseOrderDetail } from '../../../types/purchase-order';

export default function PurchaseOrderDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderDetail | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [stockLots, setStockLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [purchaseOrderData, itemsData, stockLotData] = await Promise.all([
          getPurchaseOrder(id),
          listItems(),
          listStockLots(),
        ]);
        setPurchaseOrder(purchaseOrderData);
        setItems(itemsData);
        setStockLots(stockLotData);
      } catch {
        setError('Purchase order not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading purchase order...</p>;
  }

  if (error || !purchaseOrder) {
    return (
      <section>
        <p role="alert">{error ?? 'Purchase order not found.'}</p>
        <p>
          <Link href="/purchase-orders">Back to purchase orders</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <PurchaseOrderDetailView
        purchaseOrder={purchaseOrder}
        items={items}
        stockLots={stockLots}
        onAddLine={async (payload) => {
          await createPurchaseOrderLine(id, payload);
          setPurchaseOrder(await getPurchaseOrder(id));
        }}
        onReceiveLine={async (lineId, payload) => {
          await receivePurchaseOrderLine(id, lineId, payload);
          const [purchaseOrderData, stockLotData] = await Promise.all([
            getPurchaseOrder(id),
            listStockLots(),
          ]);
          setPurchaseOrder(purchaseOrderData);
          setStockLots(stockLotData);
        }}
      />
    </section>
  );
}
