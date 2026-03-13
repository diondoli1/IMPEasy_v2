'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SupplierForm } from '../../../components/supplier-form';
import { createSupplierItemTerm, getSupplier, listItems, updateSupplier } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/commercial';
import { Badge, Button, DataTable, EmptyState, Notice, Panel, Toolbar, ToolbarGroup } from '../../../components/ui/primitives';
import type { Item } from '../../../types/item';
import type { SupplierDetail } from '../../../types/supplier';

type SupplierTab = 'general' | 'item-terms' | 'purchase-orders';

export default function SupplierDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<SupplierTab>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termForm, setTermForm] = useState({
    itemId: '',
    vendorItemCode: '',
    leadTimeDays: '0',
    unitPrice: '0',
    minimumQuantity: '1',
    isPreferred: false,
    notes: '',
  });
  const [termFeedback, setTermFeedback] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [supplierData, itemData] = await Promise.all([getSupplier(id), listItems()]);
        setSupplier(supplierData);
        setItems(itemData);
      } catch {
        setError('Supplier not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p>Loading supplier...</p>;
  }

  if (error || !supplier) {
    return (
      <section>
        <p role="alert">{error ?? 'Supplier not found.'}</p>
        <p>
          <Link href="/suppliers">Back to suppliers</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="page-shell__header">
        <div className="page-shell__title-block">
          <div className="page-shell__eyebrow">Vendors</div>
          <h1 className="page-shell__title">{supplier.name}</h1>
          <p className="page-shell__description">
            One vendor workspace for general details, item-vendor terms, and linked purchase orders.
          </p>
        </div>
        <div className="page-shell__actions">
          <Badge tone={supplier.isActive ? 'success' : 'warning'}>
            {supplier.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Link className="button button--secondary" href="/suppliers">
            Back to suppliers
          </Link>
        </div>
      </div>

      <Panel title="Vendor workspace" description="The lean MVP keeps supplier maintenance, purchasing terms, and order history in one place.">
        <Toolbar>
          <ToolbarGroup>
            {([
              ['general', 'General'],
              ['item-terms', 'Item Terms'],
              ['purchase-orders', 'Purchase Orders'],
            ] as Array<[SupplierTab, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`workspace-tab${activeTab === value ? ' workspace-tab--active' : ''}`}
                onClick={() => setActiveTab(value)}
              >
                {label}
              </button>
            ))}
          </ToolbarGroup>
        </Toolbar>

        {activeTab === 'general' ? (
          <SupplierForm
            initial={supplier}
            submitLabel="Update supplier"
            allowStatusChange
            onSubmit={async (payload) => {
              const updated = await updateSupplier(id, payload);
              setSupplier((current) => (current ? { ...current, ...updated } : current));
            }}
          />
        ) : null}

        {activeTab === 'item-terms' ? (
          <div className="page-stack">
            <Panel
              title="Add item-vendor term"
              description="Use this lightweight form to assign a vendor code, lead time, and buying defaults to an item."
            >
              <form
                className="page-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  void (async () => {
                    setTermFeedback(null);
                    try {
                      await createSupplierItemTerm(id, {
                        itemId: Number(termForm.itemId),
                        vendorItemCode: termForm.vendorItemCode || undefined,
                        leadTimeDays: Number(termForm.leadTimeDays),
                        unitPrice: Number(termForm.unitPrice),
                        minimumQuantity: Number(termForm.minimumQuantity),
                        isPreferred: termForm.isPreferred,
                        notes: termForm.notes || undefined,
                      });
                      setSupplier(await getSupplier(id));
                      setTermForm({
                        itemId: '',
                        vendorItemCode: '',
                        leadTimeDays: '0',
                        unitPrice: '0',
                        minimumQuantity: '1',
                        isPreferred: false,
                        notes: '',
                      });
                      setTermFeedback('Item-vendor term saved.');
                    } catch {
                      setTermFeedback('Unable to save the item-vendor term.');
                    }
                  })();
                }}
              >
                <label>
                  Item
                  <select
                    value={termForm.itemId}
                    onChange={(event) =>
                      setTermForm((current) => ({ ...current, itemId: event.target.value }))
                    }
                  >
                    <option value="">Select item</option>
                    {items.map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.code} {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Vendor Item Code
                  <input
                    value={termForm.vendorItemCode}
                    onChange={(event) =>
                      setTermForm((current) => ({ ...current, vendorItemCode: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Lead Time (days)
                  <input
                    type="number"
                    min={0}
                    value={termForm.leadTimeDays}
                    onChange={(event) =>
                      setTermForm((current) => ({ ...current, leadTimeDays: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Unit Price
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={termForm.unitPrice}
                    onChange={(event) =>
                      setTermForm((current) => ({ ...current, unitPrice: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Minimum Quantity
                  <input
                    type="number"
                    min={1}
                    value={termForm.minimumQuantity}
                    onChange={(event) =>
                      setTermForm((current) => ({
                        ...current,
                        minimumQuantity: event.target.value,
                      }))
                    }
                  />
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={termForm.isPreferred}
                    onChange={(event) =>
                      setTermForm((current) => ({ ...current, isPreferred: event.target.checked }))
                    }
                  />
                  Preferred vendor for the item
                </label>
                <label>
                  Notes
                  <textarea
                    rows={3}
                    value={termForm.notes}
                    onChange={(event) =>
                      setTermForm((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </label>
                <Button type="submit">Save item term</Button>
              </form>
              {termFeedback ? <Notice title="Item terms">{termFeedback}</Notice> : null}
            </Panel>

            <DataTable
              columns={[
                {
                  header: 'Item',
                  cell: (term) => (
                    <div className="stack stack--tight">
                      <strong>{term.itemName}</strong>
                      <span className="muted-copy--small mono">{term.itemCode ?? `Item ${term.itemId}`}</span>
                    </div>
                  ),
                },
                { header: 'Vendor Code', width: '120px', cell: (term) => term.vendorItemCode ?? '-' },
                { header: 'Lead Time', width: '100px', align: 'right', cell: (term) => `${term.leadTimeDays} d` },
                { header: 'Unit Price', width: '110px', align: 'right', cell: (term) => formatCurrency(term.unitPrice) },
                { header: 'Min Qty', width: '90px', align: 'right', cell: (term) => term.minimumQuantity },
                { header: 'Preferred', width: '110px', cell: (term) => <Badge tone={term.isPreferred ? 'success' : 'neutral'}>{term.isPreferred ? 'Yes' : 'No'}</Badge> },
                { header: 'Notes', cell: (term) => term.notes ?? '-' },
              ]}
              rows={supplier.itemVendorTerms}
              getRowKey={(term) => String(term.id)}
              emptyState={
                <EmptyState
                  title="No item terms yet"
                  description="Add the first item-vendor term to connect this supplier to the item master."
                />
              }
            />
          </div>
        ) : null}

        {activeTab === 'purchase-orders' ? (
          <DataTable
            columns={[
              {
                header: 'PO',
                cell: (purchaseOrder) => (
                  <div className="stack stack--tight">
                    <Link href={`/purchase-orders/${purchaseOrder.id}`} className="mono">
                      {purchaseOrder.number}
                    </Link>
                    <span className="muted-copy--small">{formatDate(purchaseOrder.orderDate)}</span>
                  </div>
                ),
              },
              { header: 'Status', width: '110px', cell: (purchaseOrder) => <Badge tone="info">{purchaseOrder.status}</Badge> },
              { header: 'Expected', width: '120px', cell: (purchaseOrder) => formatDate(purchaseOrder.expectedDate) },
              { header: 'Open Qty', width: '90px', align: 'right', cell: (purchaseOrder) => purchaseOrder.openQuantity },
              { header: 'Received', width: '90px', align: 'right', cell: (purchaseOrder) => purchaseOrder.receivedQuantity },
            ]}
            rows={supplier.purchaseOrders}
            getRowKey={(purchaseOrder) => String(purchaseOrder.id)}
            emptyState={
              <EmptyState
                title="No purchase orders"
                description="Purchase orders created for this supplier will appear here."
              />
            }
          />
        ) : null}
      </Panel>
    </section>
  );
}
