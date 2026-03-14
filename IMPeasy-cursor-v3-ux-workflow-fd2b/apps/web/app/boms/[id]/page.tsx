'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MuiButton from '@mui/material/Button';

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
import {
  createBomItem,
  getBom,
  listBomItems,
  listItems,
  updateBom,
  updateBomItem,
} from '../../../lib/api';
import { formatCurrency } from '../../../lib/commercial';
import type { Bom, BomItem } from '../../../types/bom';
import type { Item } from '../../../types/item';

type BomHeaderState = {
  code: string;
  name: string;
  description: string;
  status: string;
  notes: string;
};

type BomItemEditorState = {
  itemId: string;
  quantity: string;
  rowOrder: string;
  notes: string;
};

function createHeaderState(bom: Bom | null): BomHeaderState {
  return {
    code: bom?.code ?? '',
    name: bom?.name ?? '',
    description: bom?.description ?? '',
    status: bom?.status ?? 'draft',
    notes: bom?.notes ?? '',
  };
}

function createItemEditorState(items: Item[], bomItem?: BomItem | null): BomItemEditorState {
  return {
    itemId: bomItem ? String(bomItem.itemId) : items[0] ? String(items[0].id) : '',
    quantity: String(bomItem?.quantity ?? 1),
    rowOrder: String(bomItem?.rowOrder ?? 10),
    notes: bomItem?.notes ?? '',
  };
}

export default function BomDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [bom, setBom] = useState<Bom | null>(null);
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [headerForm, setHeaderForm] = useState<BomHeaderState>(() => createHeaderState(null));
  const [itemEditor, setItemEditor] = useState<BomItemEditorState>(() =>
    createItemEditorState([]),
  );
  const [editingBomItemId, setEditingBomItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerMessage, setHeaderMessage] = useState<string | null>(null);
  const [itemMessage, setItemMessage] = useState<string | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const loadPage = useCallback(async () => {
    const [bomData, bomItemsData, itemsData] = await Promise.all([
      getBom(id),
      listBomItems(id),
      listItems(),
    ]);

    setBom(bomData);
    setBomItems(bomItemsData);
    setItems(itemsData);
    setHeaderForm(createHeaderState(bomData));
    setItemEditor((current) =>
      editingBomItemId
        ? current
        : createItemEditorState(itemsData, null),
    );
  }, [editingBomItemId, id]);

  useEffect(() => {
    void (async () => {
      try {
        await loadPage();
      } catch {
        setError('Unable to load the BOM workspace.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPage]);

  if (loading) {
    return <p>Loading BOM...</p>;
  }

  if (error || !bom) {
    return (
      <div className="page-stack">
        <p role="alert">{error ?? 'BOM not found.'}</p>
        <ButtonLink href="/manufactured-items">Back to manufactured items</ButtonLink>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Engineering"
      title={bom.name}
      description="BOM header, component rows, and rough-cost feedback in one planner-facing workspace."
      leadingActions={
        <MuiButton component={Link} href="/boms" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back
        </MuiButton>
      }
      actions={
        <>
          <Badge tone="info">{bom.status}</Badge>
          <ButtonLink href={`/manufactured-items/${bom.itemId}`}>Open item</ButtonLink>
        </>
      }
    >
      <div className="split-grid">
        <Panel
          title="BOM header"
          description="Header fields stay editable so planners can refine naming, notes, and status without leaving the component table."
        >
          {headerError ? <Notice title="Header save failed" tone="warning">{headerError}</Notice> : null}
          {headerMessage ? <Notice title="Saved">{headerMessage}</Notice> : null}
          <form
            className="page-stack"
            onSubmit={(event) => {
              event.preventDefault();
              void (async () => {
                setSavingHeader(true);
                setHeaderError(null);
                setHeaderMessage(null);
                try {
                  const updated = await updateBom(bom.id, {
                    code: headerForm.code.trim() || undefined,
                    name: headerForm.name.trim(),
                    description: headerForm.description.trim() || undefined,
                    status: headerForm.status.trim() || undefined,
                    notes: headerForm.notes.trim() || undefined,
                  });
                  setBom(updated);
                  setHeaderForm(createHeaderState(updated));
                  setHeaderMessage('BOM header saved.');
                } catch {
                  setHeaderError('Unable to save the BOM header.');
                } finally {
                  setSavingHeader(false);
                }
              })();
            }}
          >
            <FormGrid columns={2}>
              <Field label="BOM Code">
                <input
                  className="control"
                  value={headerForm.code}
                  onChange={(event) =>
                    setHeaderForm((current) => ({ ...current, code: event.target.value }))
                  }
                />
              </Field>
              <Field label="Item">
                <input className="control" value={`${bom.itemCode} ${bom.itemName}`} readOnly />
              </Field>
              <Field label="Name">
                <input
                  className="control"
                  value={headerForm.name}
                  onChange={(event) =>
                    setHeaderForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Status">
                <select
                  className="control"
                  value={headerForm.status}
                  onChange={(event) =>
                    setHeaderForm((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="obsolete">obsolete</option>
                </select>
              </Field>
            </FormGrid>
            <Field label="Description">
              <textarea
                className="control"
                value={headerForm.description}
                onChange={(event) =>
                  setHeaderForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Field>
            <Field label="Notes">
              <textarea
                className="control"
                value={headerForm.notes}
                onChange={(event) =>
                  setHeaderForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </Field>
            <div>
              <Button type="submit" tone="primary" disabled={savingHeader}>
                {savingHeader ? 'Saving...' : 'Save header'}
              </Button>
            </div>
          </form>
        </Panel>

        <div className="page-stack">
          <Panel
            title="Rough cost"
            description="Rough cost is calculated from component quantity multiplied by each component item default price."
          >
            <div className="stat-card__value">{formatCurrency(bom.roughCost)}</div>
            <Notice title="Default linkage">
              Set the default BOM from the manufactured-item detail page before generating
              Manufacturing Orders.
            </Notice>
          </Panel>
        </div>
      </div>

      <div className="split-grid">
        <Panel
          title="Components"
          description="Component rows stay dense: row order, component item, quantity, notes, and rough line cost remain visible together."
        >
          <DataTable
            columns={[
              {
                header: 'Row',
                width: '70px',
                align: 'right',
                cell: (row) => <span className="mono">{row.rowOrder}</span>,
              },
              {
                header: 'Component',
                cell: (row) => (
                  <div className="stack stack--tight">
                    <strong>{row.itemName}</strong>
                    <span className="muted-copy--small mono">
                      {row.itemCode} · {row.unitOfMeasure}
                    </span>
                  </div>
                ),
              },
              {
                header: 'Quantity',
                width: '90px',
                align: 'right',
                cell: (row) => <span className="mono">{row.quantity}</span>,
              },
              {
                header: 'Notes',
                cell: (row) => row.notes ?? '-',
              },
              {
                header: 'Line Cost',
                width: '110px',
                align: 'right',
                cell: (row) => <span className="mono">{formatCurrency(row.lineCost)}</span>,
              },
              {
                header: 'Action',
                width: '100px',
                cell: (row) => (
                  <Button
                    onClick={() => {
                      setEditingBomItemId(row.id);
                      setItemEditor(createItemEditorState(items, row));
                      setItemError(null);
                      setItemMessage(null);
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
                title="No component rows yet"
                description="Add at least one component before using this BOM as the default for Manufacturing Orders."
              />
            }
          />
        </Panel>

        <div className="page-stack">
          <Panel
            title={editingBomItemId ? `Edit row #${editingBomItemId}` : 'Add component row'}
            description="Use the same compact editor for both new and existing rows."
          >
            {itemError ? <Notice title="Row save failed" tone="warning">{itemError}</Notice> : null}
            {itemMessage ? <Notice title="Saved">{itemMessage}</Notice> : null}
            <form
              className="page-stack"
              onSubmit={(event) => {
                event.preventDefault();
                if (!itemEditor.itemId || Number(itemEditor.quantity) <= 0) {
                  setItemError('Component item and quantity are required.');
                  return;
                }

                void (async () => {
                  setSavingItem(true);
                  setItemError(null);
                  setItemMessage(null);
                  try {
                    if (editingBomItemId) {
                      await updateBomItem(bom.id, editingBomItemId, {
                        itemId: Number(itemEditor.itemId),
                        quantity: Number(itemEditor.quantity),
                        rowOrder: Number(itemEditor.rowOrder),
                        notes: itemEditor.notes.trim() || undefined,
                      });
                      setItemMessage('Component row updated.');
                    } else {
                      await createBomItem(bom.id, {
                        itemId: Number(itemEditor.itemId),
                        quantity: Number(itemEditor.quantity),
                        rowOrder: Number(itemEditor.rowOrder),
                        notes: itemEditor.notes.trim() || undefined,
                      });
                      setItemMessage('Component row added.');
                    }

                    const [updatedBom, updatedRows] = await Promise.all([
                      getBom(bom.id),
                      listBomItems(bom.id),
                    ]);
                    setBom(updatedBom);
                    setBomItems(updatedRows);
                    setEditingBomItemId(null);
                    setItemEditor(createItemEditorState(items, null));
                  } catch {
                    setItemError('Unable to save the component row.');
                  } finally {
                    setSavingItem(false);
                  }
                })();
              }}
            >
              <Field label="Component Item">
                <select
                  className="control"
                  value={itemEditor.itemId}
                  onChange={(event) =>
                    setItemEditor((current) => ({ ...current, itemId: event.target.value }))
                  }
                >
                  <option value="">Select item</option>
                  {items.map((itemOption) => (
                    <option key={itemOption.id} value={String(itemOption.id)}>
                      {itemOption.code} {itemOption.name}
                    </option>
                  ))}
                </select>
              </Field>
              <FormGrid columns={2}>
                <Field label="Quantity">
                  <input
                    className="control"
                    type="number"
                    min={1}
                    step="1"
                    value={itemEditor.quantity}
                    onChange={(event) =>
                      setItemEditor((current) => ({ ...current, quantity: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Row Order">
                  <input
                    className="control"
                    type="number"
                    min={1}
                    step="1"
                    value={itemEditor.rowOrder}
                    onChange={(event) =>
                      setItemEditor((current) => ({ ...current, rowOrder: event.target.value }))
                    }
                  />
                </Field>
              </FormGrid>
              <Field label="Notes">
                <textarea
                  className="control"
                  value={itemEditor.notes}
                  onChange={(event) =>
                    setItemEditor((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </Field>
              <div className="toolbar">
                <div className="toolbar__group">
                  <Button type="submit" tone="primary" disabled={savingItem}>
                    {savingItem
                      ? 'Saving...'
                      : editingBomItemId
                        ? 'Update component'
                        : 'Add component'}
                  </Button>
                  {editingBomItemId ? (
                    <Button
                      onClick={() => {
                        setEditingBomItemId(null);
                        setItemEditor(createItemEditorState(items, null));
                        setItemError(null);
                        setItemMessage(null);
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </div>
            </form>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
