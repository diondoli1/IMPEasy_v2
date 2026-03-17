'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MuiButton from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { PageShell } from '../../../components/ui/page-templates';
import {
  Badge,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  Field,
  FormGrid,
  Notice,
  Panel,
} from '../../../components/ui/primitives';
import { InlineCreateItemDialog } from '../../../components/inline-create-item-dialog';
import {
  createBom,
  createBomItem,
  createRouting,
  createRoutingOperation,
  getItem,
  listBomItems,
  listBomsByItem,
  listItems,
  listRoutingOperations,
  listRoutingsByItem,
  listWorkstationGroups,
  listWorkstations,
  setBomAsDefault,
  setRoutingAsDefault,
  updateBomItem,
  updateRoutingOperation,
} from '../../../lib/api';
import { formatCurrency } from '../../../lib/commercial';
import type { Bom, BomItem } from '../../../types/bom';
import type { Item } from '../../../types/item';
import type { Routing, RoutingOperation } from '../../../types/routing';
import type { Workstation, WorkstationGroup } from '../../../types/workstation';

type TabValue = 'bom' | 'routing';

type BomItemEditorState = {
  itemId: string;
  quantity: string;
  rowOrder: string;
  notes: string;
  approximateCost: string;
};

type RoutingOperationEditorState = {
  sequence: string;
  name: string;
  description: string;
  workstation: string;
  workstationGroupId: string;
  setupTimeMinutes: string;
  runTimeMinutes: string;
  cost: string;
};

function createBomItemEditorState(items: Item[], row?: BomItem | null): BomItemEditorState {
  return {
    itemId: row ? String(row.itemId) : items[0] ? String(items[0].id) : '',
    quantity: String(row?.quantity ?? 1),
    rowOrder: String(row?.rowOrder ?? 10),
    notes: row?.notes ?? '',
    approximateCost: row?.approximateCost != null ? String(row.approximateCost) : '',
  };
}

function createRoutingOperationEditorState(
  op?: RoutingOperation | null,
): RoutingOperationEditorState {
  return {
    sequence: String(op?.sequence ?? 10),
    name: op?.name ?? '',
    description: op?.description ?? '',
    workstation: op?.workstation ?? '',
    workstationGroupId: op?.workstationGroupId != null ? String(op.workstationGroupId) : '',
    setupTimeMinutes: String(op?.setupTimeMinutes ?? 0),
    runTimeMinutes: String(op?.runTimeMinutes ?? 0),
    cost: op?.cost != null ? String(op.cost) : '',
  };
}

export default function SetupBomRoutingPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemIdParam = searchParams.get('itemId');
  const salesOrderIdParam = searchParams.get('salesOrderId');
  const itemId = itemIdParam ? Number(itemIdParam) : null;
  const salesOrderId = salesOrderIdParam ? Number(salesOrderIdParam) : null;

  const [activeTab, setActiveTab] = useState<TabValue>('bom');
  const [item, setItem] = useState<Item | null>(null);
  const [bom, setBom] = useState<Bom | null>(null);
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [routing, setRouting] = useState<Routing | null>(null);
  const [operations, setOperations] = useState<RoutingOperation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [workstationGroups, setWorkstationGroups] = useState<WorkstationGroup[]>([]);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);

  const [bomItemEditor, setBomItemEditor] = useState<BomItemEditorState>(() =>
    createBomItemEditorState([]),
  );
  const [routingOpEditor, setRoutingOpEditor] = useState<RoutingOperationEditorState>(() =>
    createRoutingOperationEditorState(),
  );
  const [editingBomItemId, setEditingBomItemId] = useState<number | null>(null);
  const [editingOpId, setEditingOpId] = useState<number | null>(null);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bomMessage, setBomMessage] = useState<string | null>(null);
  const [bomError, setBomError] = useState<string | null>(null);
  const [routingMessage, setRoutingMessage] = useState<string | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [savingBomItem, setSavingBomItem] = useState(false);
  const [savingOp, setSavingOp] = useState(false);
  const [savingDone, setSavingDone] = useState(false);

  const loadPage = useCallback(async () => {
    if (itemId == null || Number.isNaN(itemId)) return;

    const [itemData, bomsData, routingsData, itemsData, groupsData, workstationsData] = await Promise.all([
      getItem(itemId),
      listBomsByItem(itemId),
      listRoutingsByItem(itemId),
      listItems(),
      listWorkstationGroups(),
      listWorkstations(),
    ]);

    setItem(itemData);
    setItems(itemsData);
    setWorkstationGroups(groupsData);
    setWorkstations(workstationsData);

    let bomToUse = bomsData[0] ?? null;
    if (bomsData.length === 0) {
      bomToUse = await createBom({
        itemId,
        name: `${itemData.code ?? itemData.id} | BOM`,
      });
    }
    setBom(bomToUse);

    let routingToUse = routingsData[0] ?? null;
    if (routingsData.length === 0) {
      routingToUse = await createRouting({
        itemId,
        name: `${itemData.code ?? itemData.id} | Routing`,
      });
    }
    setRouting(routingToUse);

    if (bomToUse) {
      const rows = await listBomItems(bomToUse.id);
      setBomItems(rows);
    } else {
      setBomItems([]);
    }
    if (routingToUse) {
      const ops = await listRoutingOperations(routingToUse.id);
      setOperations(ops);
    } else {
      setOperations([]);
    }
  }, [itemId]);

  useEffect(() => {
    void (async () => {
      try {
        await loadPage();
      } catch {
        setError('Unable to load setup page.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPage]);

  useEffect(() => {
    if (editingBomItemId && bomItems.length > 0) {
      const row = bomItems.find((r) => r.id === editingBomItemId);
      setBomItemEditor(createBomItemEditorState(items, row ?? null));
    } else if (!editingBomItemId) {
      setBomItemEditor(createBomItemEditorState(items, null));
    }
  }, [editingBomItemId, items, bomItems]);

  useEffect(() => {
    if (editingOpId && operations.length > 0) {
      const op = operations.find((o) => o.id === editingOpId);
      setRoutingOpEditor(createRoutingOperationEditorState(op ?? null));
    } else if (!editingOpId) {
      setRoutingOpEditor(createRoutingOperationEditorState());
    }
  }, [editingOpId, operations]);

  async function handleDone(): Promise<void> {
    if (!item || !bom || !routing) return;
    if (operations.length === 0) {
      setRoutingError('Add at least one routing operation before continuing.');
      return;
    }
    setSavingDone(true);
    setBomError(null);
    setRoutingError(null);
    try {
      await setBomAsDefault(bom.id);
      await setRoutingAsDefault(routing.id);
      if (salesOrderId != null && !Number.isNaN(salesOrderId)) {
        router.push(`/customer-orders/sales-order-${salesOrderId}?tab=production`);
      } else {
        router.push('/manufacturing-orders/new');
      }
    } catch {
      setRoutingError('Unable to set default BOM and routing.');
    } finally {
      setSavingDone(false);
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error || !itemId || !item) {
    return (
      <div className="page-stack">
        <p role="alert">{error ?? 'Invalid item or missing itemId.'}</p>
        <ButtonLink href={salesOrderId ? `/customer-orders/sales-order-${salesOrderId}` : '/manufacturing-orders'}>
          Back
        </ButtonLink>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Setup BOM &amp; Routing"
      title={`${item.code ?? item.id} – ${item.name}`}
      description="Create or complete BOM and Routing for this product so Manufacturing Orders can be generated."
      leadingActions={
        <MuiButton component={Link} href={salesOrderId ? `/customer-orders/sales-order-${salesOrderId}` : '/manufacturing-orders'} variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </MuiButton>
      }
      actions={
        <>
          {bom ? <Badge tone="info">BOM ready</Badge> : null}
          {routing ? <Badge tone="info">Routing ready</Badge> : null}
          <Button tone="primary" disabled={savingDone || operations.length === 0} onClick={() => void handleDone()}>
            {savingDone ? 'Saving...' : 'Done – set as default and continue'}
          </Button>
        </>
      }
    >
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v as TabValue)} sx={{ mb: 2 }}>
        <Tab label="BOM" value="bom" />
        <Tab label="Routing" value="routing" />
      </Tabs>

      {activeTab === 'bom' && bom ? (
        <div className="split-grid">
          <Panel
            title="BOM lines"
            description="Component rows for this product. Part No and Part description come from the selected item."
          >
            {bomError ? <Notice title="BOM error" tone="warning">{bomError}</Notice> : null}
            {bomMessage ? <Notice title="Saved">{bomMessage}</Notice> : null}
            <DataTable
              columns={[
                { header: 'Number of BOM', width: '110px', cell: () => <span className="mono">{bom.code ?? bom.id}</span> },
                {
                  header: 'Name',
                  cell: (row) => <span className="mono">{row.itemCode} | BOM</span>,
                },
                { header: 'Part No', width: '100px', cell: (row) => <span className="mono">{row.itemCode}</span> },
                { header: 'Part description', cell: (row) => row.itemName },
                { header: 'Group Name', width: '120px', cell: (row) => row.itemGroup ?? '-' },
                {
                  header: 'Approximate cost',
                  width: '120px',
                  align: 'right',
                  cell: (row) => (row.approximateCost != null ? formatCurrency(row.approximateCost) : '-'),
                },
                {
                  header: 'Action',
                  width: '100px',
                  cell: (row) => (
                    <Button
                      onClick={() => {
                        setEditingBomItemId(row.id);
                        setBomItemEditor(createBomItemEditorState(items, row));
                        setBomError(null);
                        setBomMessage(null);
                      }}
                    >
                      Edit row
                    </Button>
                  ),
                },
              ]}
              rows={bomItems}
              getRowKey={(row) => String(row.id)}
              emptyState={
                <EmptyState
                  title="No BOM lines yet"
                  description="Add at least one component row below."
                />
              }
            />
          </Panel>
          <div className="page-stack">
            <Panel
              title={editingBomItemId ? `Edit BOM row` : 'Add BOM row'}
              description="Select component item, quantity, and optional approximate cost."
            >
              <form
                className="page-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!bomItemEditor.itemId || Number(bomItemEditor.quantity) <= 0) {
                    setBomError('Item and quantity are required.');
                    return;
                  }
                  void (async () => {
                    setSavingBomItem(true);
                    setBomError(null);
                    setBomMessage(null);
                    try {
                      const payload = {
                        itemId: Number(bomItemEditor.itemId),
                        quantity: Number(bomItemEditor.quantity),
                        rowOrder: Number(bomItemEditor.rowOrder),
                        notes: bomItemEditor.notes.trim() || undefined,
                        approximateCost: bomItemEditor.approximateCost.trim() ? Number(bomItemEditor.approximateCost) : undefined,
                      };
                      if (editingBomItemId) {
                        await updateBomItem(bom.id, editingBomItemId, payload);
                        setBomMessage('BOM row updated.');
                      } else {
                        await createBomItem(bom.id, payload);
                        setBomMessage('BOM row added.');
                      }
                      setBomItems(await listBomItems(bom.id));
                      setEditingBomItemId(null);
                      setBomItemEditor(createBomItemEditorState(items, null));
                    } catch {
                      setBomError('Unable to save BOM row.');
                    } finally {
                      setSavingBomItem(false);
                    }
                  })();
                }}
              >
                <Field label="Component Item">
                  <select
                    className="control"
                    value={bomItemEditor.itemId}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '__add_new__') setAddItemDialogOpen(true);
                      else setBomItemEditor((c) => ({ ...c, itemId: v }));
                    }}
                  >
                    <option value="">Select item</option>
                    <option value="__add_new__">Add new product</option>
                    {items.map((i) => (
                      <option key={i.id} value={String(i.id)}>{i.code} {i.name}</option>
                    ))}
                  </select>
                </Field>
                <FormGrid columns={2}>
                  <Field label="Quantity">
                    <input
                      className="control"
                      type="number"
                      min={1}
                      value={bomItemEditor.quantity}
                      onChange={(e) => setBomItemEditor((c) => ({ ...c, quantity: e.target.value }))}
                    />
                  </Field>
                  <Field label="Approximate cost">
                    <input
                      className="control"
                      type="number"
                      min={0}
                      step="0.01"
                      value={bomItemEditor.approximateCost}
                      onChange={(e) => setBomItemEditor((c) => ({ ...c, approximateCost: e.target.value }))}
                    />
                  </Field>
                </FormGrid>
                <Field label="Notes">
                  <input
                    className="control"
                    value={bomItemEditor.notes}
                    onChange={(e) => setBomItemEditor((c) => ({ ...c, notes: e.target.value }))}
                  />
                </Field>
                <div className="toolbar">
                  <Button type="submit" tone="primary" disabled={savingBomItem}>
                    {savingBomItem ? 'Saving...' : editingBomItemId ? 'Update row' : 'Add row'}
                  </Button>
                  {editingBomItemId ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setEditingBomItemId(null);
                        setBomItemEditor(createBomItemEditorState(items, null));
                        setBomError(null);
                        setBomMessage(null);
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </Panel>
          </div>
        </div>
      ) : null}

      {activeTab === 'routing' && routing ? (
        <div className="split-grid">
          <Panel
            title="Routing operations"
            description="Operations for this product. Duration = setup + run time; Cost can be set per operation."
          >
            {routingError ? <Notice title="Routing error" tone="warning">{routingError}</Notice> : null}
            {routingMessage ? <Notice title="Saved">{routingMessage}</Notice> : null}
            <DataTable
              columns={[
                { header: 'Number of routing', width: '120px', cell: () => <span className="mono">{routing.code ?? routing.id}</span> },
                { header: 'Name', cell: (row) => row.name },
                { header: 'Part No', width: '100px', cell: () => <span className="mono">{routing.itemCode}</span> },
                { header: 'Part description', cell: () => routing.itemName },
                { header: 'Group Name', width: '120px', cell: (row) => row.workstationGroupName ?? '-' },
                {
                  header: 'Duration',
                  width: '90px',
                  align: 'right',
                  cell: (row) => <span className="mono">{(row.setupTimeMinutes + row.runTimeMinutes)}m</span>,
                },
                {
                  header: 'Cost',
                  width: '100px',
                  align: 'right',
                  cell: (row) => (row.cost != null ? formatCurrency(row.cost) : '-'),
                },
                {
                  header: 'Action',
                  width: '100px',
                  cell: (row) => (
                    <Button
                      onClick={() => {
                        setEditingOpId(row.id);
                        setRoutingOpEditor(createRoutingOperationEditorState(row));
                        setRoutingError(null);
                        setRoutingMessage(null);
                      }}
                    >
                      Edit row
                    </Button>
                  ),
                },
              ]}
              rows={operations}
              getRowKey={(row) => String(row.id)}
              emptyState={
                <EmptyState
                  title="No operations yet"
                  description="Add at least one operation below so this routing can be used for Manufacturing Orders."
                />
              }
            />
          </Panel>
          <div className="page-stack">
            <Panel
              title={editingOpId ? 'Edit operation' : 'Add operation'}
              description="Sequence, name, workstation group, duration, and cost."
            >
              <form
                className="page-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!routingOpEditor.name.trim()) {
                    setRoutingError('Operation name is required.');
                    return;
                  }
                  void (async () => {
                    setSavingOp(true);
                    setRoutingError(null);
                    setRoutingMessage(null);
                    try {
                      const payload = {
                        sequence: Number(routingOpEditor.sequence),
                        name: routingOpEditor.name.trim(),
                        description: routingOpEditor.description.trim() || undefined,
                        workstation: routingOpEditor.workstation.trim() || undefined,
                        workstationGroupId: routingOpEditor.workstationGroupId.trim() ? Number(routingOpEditor.workstationGroupId) : undefined,
                        setupTimeMinutes: Number(routingOpEditor.setupTimeMinutes),
                        runTimeMinutes: Number(routingOpEditor.runTimeMinutes),
                        cost: routingOpEditor.cost.trim() ? Number(routingOpEditor.cost) : undefined,
                      };
                      if (editingOpId) {
                        await updateRoutingOperation(routing.id, editingOpId, payload);
                        setRoutingMessage('Operation updated.');
                      } else {
                        await createRoutingOperation(routing.id, payload);
                        setRoutingMessage('Operation added.');
                      }
                      setOperations(await listRoutingOperations(routing.id));
                      setEditingOpId(null);
                      setRoutingOpEditor(createRoutingOperationEditorState());
                    } catch {
                      setRoutingError('Unable to save operation.');
                    } finally {
                      setSavingOp(false);
                    }
                  })();
                }}
              >
                <FormGrid columns={2}>
                  <Field label="Sequence">
                    <input
                      className="control"
                      type="number"
                      min={1}
                      value={routingOpEditor.sequence}
                      onChange={(e) => setRoutingOpEditor((c) => ({ ...c, sequence: e.target.value }))}
                    />
                  </Field>
                  <Field label="Group Name (workstation group)">
                    <select
                      className="control"
                      value={routingOpEditor.workstationGroupId}
                      onChange={(e) => setRoutingOpEditor((c) => ({ ...c, workstationGroupId: e.target.value }))}
                    >
                      <option value="">—</option>
                      {workstationGroups.map((g) => (
                        <option key={g.id} value={String(g.id)}>{g.name}</option>
                      ))}
                    </select>
                  </Field>
                </FormGrid>
                <Field label="Operation Name">
                  <input
                    className="control"
                    value={routingOpEditor.name}
                    onChange={(e) => setRoutingOpEditor((c) => ({ ...c, name: e.target.value }))}
                  />
                </Field>
                <Field label="Description">
                  <input
                    className="control"
                    value={routingOpEditor.description}
                    onChange={(e) => setRoutingOpEditor((c) => ({ ...c, description: e.target.value }))}
                  />
                </Field>
                <Field label="Workstation">
                  <select
                    className="control"
                    value={routingOpEditor.workstation}
                    onChange={(e) => setRoutingOpEditor((c) => ({ ...c, workstation: e.target.value }))}
                  >
                    <option value="">—</option>
                    {workstations.map((ws) => (
                      <option key={ws.id} value={ws.name}>
                        {ws.code ? `${ws.code} – ` : ''}{ws.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <FormGrid columns={3}>
                  <Field label="Setup (min)">
                    <input
                      className="control"
                      type="number"
                      min={0}
                      value={routingOpEditor.setupTimeMinutes}
                      onChange={(e) => setRoutingOpEditor((c) => ({ ...c, setupTimeMinutes: e.target.value }))}
                    />
                  </Field>
                  <Field label="Run (min)">
                    <input
                      className="control"
                      type="number"
                      min={0}
                      value={routingOpEditor.runTimeMinutes}
                      onChange={(e) => setRoutingOpEditor((c) => ({ ...c, runTimeMinutes: e.target.value }))}
                    />
                  </Field>
                  <Field label="Cost">
                    <input
                      className="control"
                      type="number"
                      min={0}
                      step="0.01"
                      value={routingOpEditor.cost}
                      onChange={(e) => setRoutingOpEditor((c) => ({ ...c, cost: e.target.value }))}
                    />
                  </Field>
                </FormGrid>
                <div className="toolbar">
                  <Button type="submit" tone="primary" disabled={savingOp}>
                    {savingOp ? 'Saving...' : editingOpId ? 'Update operation' : 'Add operation'}
                  </Button>
                  {editingOpId ? (
                    <Button
                      type="button"
                      onClick={() => {
                        setEditingOpId(null);
                        setRoutingOpEditor(createRoutingOperationEditorState());
                        setRoutingError(null);
                        setRoutingMessage(null);
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </Panel>
          </div>
        </div>
      ) : null}

      <InlineCreateItemDialog
        open={addItemDialogOpen}
        onClose={() => setAddItemDialogOpen(false)}
        onCreated={(created) => {
          setItems((prev) => [...prev, created]);
          setBomItemEditor((c) => ({ ...c, itemId: String(created.id) }));
          setAddItemDialogOpen(false);
        }}
      />
    </PageShell>
  );
}
