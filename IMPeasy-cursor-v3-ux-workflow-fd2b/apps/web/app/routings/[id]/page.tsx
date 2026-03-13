'use client';

import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

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
  createRoutingOperation,
  getRouting,
  listRoutingOperations,
  updateRouting,
  updateRoutingOperation,
} from '../../../lib/api';
import type { Routing, RoutingOperation } from '../../../types/routing';

type RoutingHeaderState = {
  code: string;
  name: string;
  description: string;
  status: string;
};

type RoutingOperationEditorState = {
  sequence: string;
  name: string;
  description: string;
  workstation: string;
  setupTimeMinutes: string;
  runTimeMinutes: string;
  queueNotes: string;
  moveNotes: string;
};

function createHeaderState(routing: Routing | null): RoutingHeaderState {
  return {
    code: routing?.code ?? '',
    name: routing?.name ?? '',
    description: routing?.description ?? '',
    status: routing?.status ?? 'draft',
  };
}

function createOperationEditorState(
  operation?: RoutingOperation | null,
): RoutingOperationEditorState {
  return {
    sequence: String(operation?.sequence ?? 10),
    name: operation?.name ?? '',
    description: operation?.description ?? '',
    workstation: operation?.workstation ?? '',
    setupTimeMinutes: String(operation?.setupTimeMinutes ?? 0),
    runTimeMinutes: String(operation?.runTimeMinutes ?? 0),
    queueNotes: operation?.queueNotes ?? '',
    moveNotes: operation?.moveNotes ?? '',
  };
}

export default function RoutingDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [routing, setRouting] = useState<Routing | null>(null);
  const [operations, setOperations] = useState<RoutingOperation[]>([]);
  const [headerForm, setHeaderForm] = useState<RoutingHeaderState>(() => createHeaderState(null));
  const [operationEditor, setOperationEditor] = useState<RoutingOperationEditorState>(() =>
    createOperationEditorState(),
  );
  const [editingOperationId, setEditingOperationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerMessage, setHeaderMessage] = useState<string | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingOperation, setSavingOperation] = useState(false);

  const loadPage = useCallback(async () => {
    const [routingData, operationData] = await Promise.all([
      getRouting(id),
      listRoutingOperations(id),
    ]);

    setRouting(routingData);
    setOperations(operationData);
    setHeaderForm(createHeaderState(routingData));
  }, [id]);

  useEffect(() => {
    void (async () => {
      try {
        await loadPage();
      } catch {
        setError('Unable to load the routing workspace.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPage]);

  if (loading) {
    return <p>Loading routing...</p>;
  }

  if (error || !routing) {
    return (
      <div className="page-stack">
        <p role="alert">{error ?? 'Routing not found.'}</p>
        <ButtonLink href="/manufactured-items">Back to manufactured items</ButtonLink>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Engineering"
      title={routing.name}
      description="Routing header, operation rows, workstation notes, and timing fields in one operational workspace."
      actions={
        <>
          <Badge tone="info">{routing.status}</Badge>
          <ButtonLink href={`/manufactured-items/${routing.itemId}`}>Open item</ButtonLink>
        </>
      }
    >
      <div className="split-grid">
        <Panel
          title="Routing header"
          description="Header values stay editable without losing the ordered operation context."
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
                  const updated = await updateRouting(routing.id, {
                    code: headerForm.code.trim() || undefined,
                    name: headerForm.name.trim(),
                    description: headerForm.description.trim() || undefined,
                    status: headerForm.status.trim() || undefined,
                  });
                  setRouting(updated);
                  setHeaderForm(createHeaderState(updated));
                  setHeaderMessage('Routing header saved.');
                } catch {
                  setHeaderError('Unable to save the routing header.');
                } finally {
                  setSavingHeader(false);
                }
              })();
            }}
          >
            <FormGrid columns={2}>
              <Field label="Routing Code">
                <input
                  className="control"
                  value={headerForm.code}
                  onChange={(event) =>
                    setHeaderForm((current) => ({ ...current, code: event.target.value }))
                  }
                />
              </Field>
              <Field label="Item">
                <input
                  className="control"
                  value={`${routing.itemCode} ${routing.itemName}`}
                  readOnly
                />
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
            <div>
              <Button type="submit" tone="primary" disabled={savingHeader}>
                {savingHeader ? 'Saving...' : 'Save header'}
              </Button>
            </div>
          </form>
        </Panel>

        <div className="page-stack">
          <Panel
            title="Routing note"
            description="The default routing is set from the manufactured-item detail page."
          >
            <Notice title="Operation copy behavior">
              Sequence, workstation, and timing values from this routing are copied into each
              Manufacturing Order when the planner generates it from a sales order.
            </Notice>
          </Panel>
        </div>
      </div>

      <div className="split-grid">
        <Panel
          title="Operations"
          description="Keep sequence, workstation, and timing visible in one dense table so the routing can be checked at a glance."
        >
          <DataTable
            columns={[
              {
                header: 'Seq',
                width: '68px',
                align: 'right',
                cell: (row) => <span className="mono">{row.sequence}</span>,
              },
              {
                header: 'Operation',
                cell: (row) => (
                  <div className="stack stack--tight">
                    <strong>{row.name}</strong>
                    <span className="muted-copy--small">{row.description ?? 'No description'}</span>
                  </div>
                ),
              },
              {
                header: 'Workstation',
                width: '120px',
                cell: (row) => row.workstation ?? '-',
              },
              {
                header: 'Setup',
                width: '86px',
                align: 'right',
                cell: (row) => <span className="mono">{row.setupTimeMinutes}m</span>,
              },
              {
                header: 'Run',
                width: '86px',
                align: 'right',
                cell: (row) => <span className="mono">{row.runTimeMinutes}m</span>,
              },
              {
                header: 'Notes',
                cell: (row) => {
                  const notes = [row.queueNotes, row.moveNotes].filter(Boolean);
                  return notes.length > 0 ? notes.join(' / ') : '-';
                },
              },
              {
                header: 'Action',
                width: '100px',
                cell: (row) => (
                  <Button
                    onClick={() => {
                      setEditingOperationId(row.id);
                      setOperationEditor(createOperationEditorState(row));
                      setOperationError(null);
                      setOperationMessage(null);
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
                description="Add at least one operation before using this routing as the default for Manufacturing Orders."
              />
            }
          />
        </Panel>

        <div className="page-stack">
          <Panel
            title={editingOperationId ? `Edit operation #${editingOperationId}` : 'Add operation'}
            description="Use one compact editor for both creation and reorder changes."
          >
            {operationError ? (
              <Notice title="Operation save failed" tone="warning">{operationError}</Notice>
            ) : null}
            {operationMessage ? <Notice title="Saved">{operationMessage}</Notice> : null}
            <form
              className="page-stack"
              onSubmit={(event) => {
                event.preventDefault();

                if (!operationEditor.name.trim() || Number(operationEditor.sequence) <= 0) {
                  setOperationError('Operation name and sequence are required.');
                  return;
                }

                void (async () => {
                  setSavingOperation(true);
                  setOperationError(null);
                  setOperationMessage(null);
                  try {
                    const payload = {
                      sequence: Number(operationEditor.sequence),
                      name: operationEditor.name.trim(),
                      description: operationEditor.description.trim() || undefined,
                      workstation: operationEditor.workstation.trim() || undefined,
                      setupTimeMinutes: Number(operationEditor.setupTimeMinutes),
                      runTimeMinutes: Number(operationEditor.runTimeMinutes),
                      queueNotes: operationEditor.queueNotes.trim() || undefined,
                      moveNotes: operationEditor.moveNotes.trim() || undefined,
                    };

                    if (editingOperationId) {
                      await updateRoutingOperation(routing.id, editingOperationId, payload);
                      setOperationMessage('Operation updated.');
                    } else {
                      await createRoutingOperation(routing.id, payload);
                      setOperationMessage('Operation added.');
                    }

                    setOperations(await listRoutingOperations(routing.id));
                    setEditingOperationId(null);
                    setOperationEditor(createOperationEditorState());
                  } catch {
                    setOperationError('Unable to save the routing operation.');
                  } finally {
                    setSavingOperation(false);
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
                    step="1"
                    value={operationEditor.sequence}
                    onChange={(event) =>
                      setOperationEditor((current) => ({
                        ...current,
                        sequence: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Workstation">
                  <input
                    className="control"
                    value={operationEditor.workstation}
                    onChange={(event) =>
                      setOperationEditor((current) => ({
                        ...current,
                        workstation: event.target.value,
                      }))
                    }
                  />
                </Field>
              </FormGrid>
              <Field label="Operation Name">
                <input
                  className="control"
                  value={operationEditor.name}
                  onChange={(event) =>
                    setOperationEditor((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="control"
                  value={operationEditor.description}
                  onChange={(event) =>
                    setOperationEditor((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>
              <FormGrid columns={2}>
                <Field label="Setup Time (Minutes)">
                  <input
                    className="control"
                    type="number"
                    min={0}
                    step="1"
                    value={operationEditor.setupTimeMinutes}
                    onChange={(event) =>
                      setOperationEditor((current) => ({
                        ...current,
                        setupTimeMinutes: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Run Time (Minutes)">
                  <input
                    className="control"
                    type="number"
                    min={0}
                    step="1"
                    value={operationEditor.runTimeMinutes}
                    onChange={(event) =>
                      setOperationEditor((current) => ({
                        ...current,
                        runTimeMinutes: event.target.value,
                      }))
                    }
                  />
                </Field>
              </FormGrid>
              <Field label="Queue Notes">
                <textarea
                  className="control"
                  value={operationEditor.queueNotes}
                  onChange={(event) =>
                    setOperationEditor((current) => ({
                      ...current,
                      queueNotes: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Move Notes">
                <textarea
                  className="control"
                  value={operationEditor.moveNotes}
                  onChange={(event) =>
                    setOperationEditor((current) => ({
                      ...current,
                      moveNotes: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="toolbar">
                <div className="toolbar__group">
                  <Button type="submit" tone="primary" disabled={savingOperation}>
                    {savingOperation
                      ? 'Saving...'
                      : editingOperationId
                        ? 'Update operation'
                        : 'Add operation'}
                  </Button>
                  {editingOperationId ? (
                    <Button
                      onClick={() => {
                        setEditingOperationId(null);
                        setOperationEditor(createOperationEditorState());
                        setOperationError(null);
                        setOperationMessage(null);
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
