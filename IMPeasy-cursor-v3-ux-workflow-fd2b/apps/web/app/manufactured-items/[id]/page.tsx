'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { ManufacturedItemForm } from '../../../components/manufactured-item-form';
import { PageShell } from '../../../components/ui/page-templates';
import {
  Badge,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  Notice,
  Panel,
  StatCard,
  StatGrid,
  Toolbar,
  ToolbarGroup,
} from '../../../components/ui/primitives';
import {
  getManufacturedItem,
  listItemVendorTerms,
  listBomsByItem,
  listRoutingsByItem,
  listSuppliers,
  setBomAsDefault,
  setRoutingAsDefault,
  updateManufacturedItem,
} from '../../../lib/api';
import {
  booleanTone,
  formatProductionDateTime,
  itemTypeTone,
  normalizeProductionStatus,
} from '../../../lib/production';
import type { Bom } from '../../../types/bom';
import type { Item } from '../../../types/item';
import type { Routing } from '../../../types/routing';
import type { ItemVendorTerm, Supplier } from '../../../types/supplier';

type ItemTab = 'general' | 'boms' | 'routings' | 'stock' | 'purchasing' | 'history';

const ITEM_TABS: Array<{ value: ItemTab; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'boms', label: 'BOMs' },
  { value: 'routings', label: 'Routings' },
  { value: 'stock', label: 'Stock' },
  { value: 'purchasing', label: 'Purchasing' },
  { value: 'history', label: 'History' },
];

export default function ManufacturedItemDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [item, setItem] = useState<Item | null>(null);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [routings, setRoutings] = useState<Routing[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [itemVendorTerms, setItemVendorTerms] = useState<ItemVendorTerm[]>([]);
  const [activeTab, setActiveTab] = useState<ItemTab>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingBomId, setLoadingBomId] = useState<number | null>(null);
  const [loadingRoutingId, setLoadingRoutingId] = useState<number | null>(null);

  const loadPage = useCallback(async () => {
    const [itemData, bomData, routingData, supplierData, itemVendorTermData] = await Promise.all([
      getManufacturedItem(id),
      listBomsByItem(id),
      listRoutingsByItem(id),
      listSuppliers(),
      listItemVendorTerms(id),
    ]);

    setItem(itemData);
    setBoms(bomData);
    setRoutings(routingData);
    setSuppliers(supplierData);
    setItemVendorTerms(itemVendorTermData);
  }, [id]);

  useEffect(() => {
    void (async () => {
      try {
        await loadPage();
      } catch {
        setError('Unable to load the manufactured-item workspace.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPage]);

  if (loading) {
    return <p>Loading manufactured item...</p>;
  }

  if (error || !item) {
    return (
      <div className="page-stack">
        <p role="alert">{error ?? 'Manufactured item not found.'}</p>
        <ButtonLink href="/manufactured-items">Back to manufactured items</ButtonLink>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Engineering"
      title={item.name}
      description="Tabbed manufacturing item workspace with engineering defaults, stock planning hints, purchasing context, and direct links into BOM and routing detail."
      actions={
        <>
          <Badge tone={itemTypeTone(item.itemType)}>{normalizeProductionStatus(item.itemType)}</Badge>
          <Badge tone={booleanTone(item.isActive)}>{item.isActive ? 'active' : 'inactive'}</Badge>
          <ButtonLink href="/manufactured-items">Back to list</ButtonLink>
          <ButtonLink href={`/boms/new?itemId=${item.id}`}>New BOM</ButtonLink>
          <ButtonLink href={`/routings/new?itemId=${item.id}`}>New routing</ButtonLink>
        </>
      }
    >
      <StatGrid>
        <StatCard label="Item Code" value={<span className="mono">{item.code}</span>} />
        <StatCard label="Default BOM" value={item.defaultBomName ?? 'Not set'} />
        <StatCard label="Default Routing" value={item.defaultRoutingName ?? 'Not set'} />
        <StatCard label="Preferred Vendor" value={item.preferredVendorName ?? 'Not set'} />
      </StatGrid>

      <Panel
        title="Item workspace"
        description="The production slice uses one item workspace with tabs so planners can move from defaults into engineering detail without leaving context."
      >
        <Toolbar>
          <ToolbarGroup>
            {ITEM_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`workspace-tab${activeTab === tab.value ? ' workspace-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </ToolbarGroup>
          <ToolbarGroup>
            <span className="muted-copy">
              Item `{item.code}` is the shared source for BOM, routing, production, stock, and
              purchasing defaults.
            </span>
          </ToolbarGroup>
        </Toolbar>

        {actionError ? <Notice title="Action failed" tone="warning">{actionError}</Notice> : null}

        {activeTab === 'general' ? (
          <ManufacturedItemForm
            initial={item}
            boms={boms}
            routings={routings}
            suppliers={suppliers}
            submitLabel="Save item"
            onSubmit={async (payload) => {
              const updated = await updateManufacturedItem(item.id, payload);
              setItem(updated);
            }}
          />
        ) : null}

        {activeTab === 'boms' ? (
          <div className="split-grid">
            <Panel
              title="BOM links"
              description="Every manufactured item can keep multiple BOMs, but one default BOM drives Manufacturing Order generation."
            >
              <DataTable
                columns={[
                  {
                    header: 'BOM',
                    cell: (bom) => (
                      <div className="stack stack--tight">
                        <Link href={`/boms/${bom.id}`} className="mono">
                          {bom.code}
                        </Link>
                        <strong>{bom.name}</strong>
                      </div>
                    ),
                  },
                  {
                    header: 'Status',
                    width: '120px',
                    cell: (bom) => <Badge tone={bom.id === item.defaultBomId ? 'success' : 'neutral'}>{bom.status}</Badge>,
                  },
                  {
                    header: 'Rough Cost',
                    width: '120px',
                    align: 'right',
                    cell: (bom) => <span className="mono">{bom.roughCost.toFixed(2)}</span>,
                  },
                  {
                    header: 'Default',
                    width: '110px',
                    cell: (bom) => (
                      <Button
                        disabled={bom.id === item.defaultBomId || loadingBomId === bom.id}
                        onClick={() => {
                          void (async () => {
                            setLoadingBomId(bom.id);
                            setActionError(null);
                            try {
                              await setBomAsDefault(bom.id);
                              await loadPage();
                            } catch {
                              setActionError('Unable to set the default BOM.');
                            } finally {
                              setLoadingBomId(null);
                            }
                          })();
                        }}
                      >
                        {bom.id === item.defaultBomId ? 'Default' : loadingBomId === bom.id ? 'Saving...' : 'Set default'}
                      </Button>
                    ),
                  },
                ]}
                rows={boms}
                getRowKey={(bom) => String(bom.id)}
                emptyState={
                  <EmptyState
                    title="No BOMs yet"
                    description="Create the first BOM for this item, then set one default before generating Manufacturing Orders."
                    action={<ButtonLink href={`/boms/new?itemId=${item.id}`}>Create BOM</ButtonLink>}
                  />
                }
              />
            </Panel>

            <div className="page-stack">
              <Panel
                title="Default behavior"
                description="The default BOM is used when the planner generates a Manufacturing Order from a sales order."
              >
                <Notice title="Current default">
                  {item.defaultBomName
                    ? `${item.defaultBomName} is the active default for item ${item.code}.`
                    : `No default BOM is configured for item ${item.code}.`}
                </Notice>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === 'routings' ? (
          <div className="split-grid">
            <Panel
              title="Routing links"
              description="One default routing defines the ordered operation sequence that will be copied into each Manufacturing Order."
            >
              <DataTable
                columns={[
                  {
                    header: 'Routing',
                    cell: (routing) => (
                      <div className="stack stack--tight">
                        <Link href={`/routings/${routing.id}`} className="mono">
                          {routing.code}
                        </Link>
                        <strong>{routing.name}</strong>
                      </div>
                    ),
                  },
                  {
                    header: 'Status',
                    width: '120px',
                    cell: (routing) => (
                      <Badge tone={routing.id === item.defaultRoutingId ? 'success' : 'neutral'}>
                        {routing.status}
                      </Badge>
                    ),
                  },
                  {
                    header: 'Default',
                    width: '110px',
                    cell: (routing) => (
                      <Button
                        disabled={routing.id === item.defaultRoutingId || loadingRoutingId === routing.id}
                        onClick={() => {
                          void (async () => {
                            setLoadingRoutingId(routing.id);
                            setActionError(null);
                            try {
                              await setRoutingAsDefault(routing.id);
                              await loadPage();
                            } catch {
                              setActionError('Unable to set the default routing.');
                            } finally {
                              setLoadingRoutingId(null);
                            }
                          })();
                        }}
                      >
                        {routing.id === item.defaultRoutingId
                          ? 'Default'
                          : loadingRoutingId === routing.id
                            ? 'Saving...'
                            : 'Set default'}
                      </Button>
                    ),
                  },
                ]}
                rows={routings}
                getRowKey={(routing) => String(routing.id)}
                emptyState={
                  <EmptyState
                    title="No routings yet"
                    description="Create the first routing for this item, then set one default before generating Manufacturing Orders."
                    action={<ButtonLink href={`/routings/new?itemId=${item.id}`}>Create routing</ButtonLink>}
                  />
                }
              />
            </Panel>

            <div className="page-stack">
              <Panel
                title="Routing usage"
                description="Routing sequence, workstation, and time fields are copied into Manufacturing Order operations at generation time."
              >
                <Notice title="Current default">
                  {item.defaultRoutingName
                    ? `${item.defaultRoutingName} is the active default routing for item ${item.code}.`
                    : `No default routing is configured for item ${item.code}.`}
                </Notice>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === 'stock' ? (
          <div className="split-grid">
            <Panel
              title="Stock planning"
              description="The active production slice keeps only the stock hints needed by engineering and Manufacturing Order planning."
            >
              <StatGrid>
                <StatCard label="Reorder Point" value={<span className="mono">{item.reorderPoint}</span>} />
                <StatCard label="Safety Stock" value={<span className="mono">{item.safetyStock}</span>} />
                <StatCard label="Unit Of Measure" value={item.unitOfMeasure} />
                <StatCard label="Active" value={item.isActive ? 'Yes' : 'No'} />
              </StatGrid>
            </Panel>

            <div className="page-stack">
              <Panel
                title="Scope note"
                description="Detailed stock lots and movement history remain in the next slice."
              >
                <Notice title="Deferred correctly">
                  `MVP-030` keeps only reorder point and safety stock hints here. Detailed stock lots,
                  movement ledgers, and receipts stay in `MVP-040`.
                </Notice>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === 'purchasing' ? (
          <div className="split-grid">
            <Panel
              title="Purchasing defaults"
              description="The purchasing tab now shows the item-vendor terms that drive supplier choice, lead time, and unit price."
            >
              <StatGrid>
                <StatCard label="Preferred Vendor" value={item.preferredVendorName ?? 'Not set'} />
                <StatCard label="Default Price" value={<span className="mono">{item.defaultPrice.toFixed(2)}</span>} />
                <StatCard label="Type" value={normalizeProductionStatus(item.itemType)} />
                <StatCard label="Group" value={item.itemGroup ?? 'Not set'} />
              </StatGrid>

              <DataTable
                columns={[
                  {
                    header: 'Vendor',
                    cell: (term) => (
                      <div className="stack stack--tight">
                        <strong>{term.supplierName}</strong>
                        <span className="muted-copy--small mono">{term.supplierCode ?? `Supplier ${term.supplierId}`}</span>
                      </div>
                    ),
                  },
                  { header: 'Vendor Item Code', width: '130px', cell: (term) => term.vendorItemCode ?? '-' },
                  { header: 'Lead Time', width: '100px', align: 'right', cell: (term) => `${term.leadTimeDays} d` },
                  { header: 'Unit Price', width: '110px', align: 'right', cell: (term) => term.unitPrice.toFixed(2) },
                  { header: 'Minimum Qty', width: '110px', align: 'right', cell: (term) => term.minimumQuantity },
                  {
                    header: 'Preferred',
                    width: '110px',
                    cell: (term) => (
                      <Badge tone={term.isPreferred ? 'success' : 'neutral'}>
                        {term.isPreferred ? 'Yes' : 'No'}
                      </Badge>
                    ),
                  },
                ]}
                rows={itemVendorTerms}
                getRowKey={(term) => String(term.id)}
                emptyState={
                  <EmptyState
                    title="No item-vendor terms"
                    description="Add terms from the supplier workspace to make purchasing defaults visible here."
                  />
                }
              />
            </Panel>

            <div className="page-stack">
              <Panel
                title="Purchasing workflow"
                description="This item tab is now read-connected to the supplier workspace and purchase-order flow."
              >
                <Notice title="Where to act">
                  Create or edit the actual item-vendor terms from the supplier detail page, then use
                  purchase orders for receiving and lot creation.
                </Notice>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === 'history' ? (
          <div className="split-grid">
            <Panel
              title="Record history"
              description="The item workspace history is intentionally lean for this slice."
            >
              <DataTable
                columns={[
                  {
                    header: 'Field',
                    width: '160px',
                    cell: (row) => row.label,
                  },
                  {
                    header: 'Value',
                    cell: (row) => row.value,
                  },
                ]}
                rows={[
                  { id: 'created', label: 'Created', value: formatProductionDateTime(item.createdAt) },
                  { id: 'updated', label: 'Updated', value: formatProductionDateTime(item.updatedAt) },
                  { id: 'default-bom', label: 'Default BOM', value: item.defaultBomName ?? 'Not set' },
                  { id: 'default-routing', label: 'Default Routing', value: item.defaultRoutingName ?? 'Not set' },
                ]}
                getRowKey={(row) => row.id}
              />
            </Panel>

            <div className="page-stack">
              <Panel
                title="Traceability note"
                description="Later slices attach this item to stock lots, purchasing, and shipping history."
              >
                <Notice title="Current scope">
                  The key production traceability in `MVP-030` begins once this item is used by a
                  BOM, routing, and Manufacturing Order. Downstream stock and fulfillment history
                  appears in later slices.
                </Notice>
              </Panel>
            </div>
          </div>
        ) : null}
      </Panel>
    </PageShell>
  );
}
