'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  createSettingsEntry,
  deleteSettingsEntry,
  listSettingsEntries,
  updateSettingsEntry,
} from '../lib/api';
import type { SettingsListEntry, SettingsListType } from '../types/settings';
import { SettingsTemplate } from './ui/page-templates';
import {
  Badge,
  Button,
  DataTable,
  DialogFrame,
  EmptyState,
  Field,
  FormGrid,
  Notice,
  Toolbar,
  ToolbarGroup,
} from './ui/primitives';
import type { TableColumn } from './ui/primitives';

type NumericFieldConfig = {
  label: string;
  placeholder: string;
  suffix?: string;
};

type SettingsListPageProps = {
  title: string;
  description: string;
  listType: SettingsListType;
  numericField?: NumericFieldConfig;
};

type EntryDraft = {
  code: string;
  label: string;
  numericValue: string;
  isActive: boolean;
  sortOrder: string;
};

function createEmptyDraft(): EntryDraft {
  return {
    code: '',
    label: '',
    numericValue: '',
    isActive: true,
    sortOrder: '',
  };
}

function toDraft(entry: SettingsListEntry): EntryDraft {
  return {
    code: entry.code,
    label: entry.label,
    numericValue: entry.numericValue === null ? '' : String(entry.numericValue),
    isActive: entry.isActive,
    sortOrder: String(entry.sortOrder),
  };
}

function parseOptionalNumber(rawValue: string): number | undefined {
  const normalized = rawValue.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function SettingsListPage({
  title,
  description,
  listType,
  numericField,
}: SettingsListPageProps): JSX.Element {
  const [entries, setEntries] = useState<SettingsListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<SettingsListEntry | null>(null);
  const [draft, setDraft] = useState<EntryDraft>(createEmptyDraft());

  const loadEntries = async (): Promise<void> => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const loadedEntries = await listSettingsEntries(listType);
      setEntries(loadedEntries);
    } catch {
      setLoadError(`Unable to load ${title.toLowerCase()}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listType]);

  const openCreateDialog = (): void => {
    setEditingEntry(null);
    setDraft(createEmptyDraft());
    setDialogError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (entry: SettingsListEntry): void => {
    setEditingEntry(entry);
    setDraft(toDraft(entry));
    setDialogError(null);
    setIsDialogOpen(true);
  };

  const closeDialog = (): void => {
    if (isSaving) {
      return;
    }

    setIsDialogOpen(false);
    setDialogError(null);
  };

  const handleSave = async (): Promise<void> => {
    const normalizedCode = draft.code.trim();
    const normalizedLabel = draft.label.trim();

    if (!normalizedCode || !normalizedLabel) {
      setDialogError('Code and label are required.');
      return;
    }

    const numericValue = parseOptionalNumber(draft.numericValue);
    if (numericField && draft.numericValue.trim().length > 0 && numericValue === undefined) {
      setDialogError(`${numericField.label} must be a number.`);
      return;
    }

    const parsedSortOrder = Number.parseInt(draft.sortOrder.trim(), 10);
    const sortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : undefined;

    setIsSaving(true);
    setDialogError(null);
    setSavedMessage(null);

    try {
      if (editingEntry) {
        await updateSettingsEntry(listType, editingEntry.id, {
          code: normalizedCode,
          label: normalizedLabel,
          numericValue,
          isActive: draft.isActive,
          sortOrder,
        });
      } else {
        await createSettingsEntry(listType, {
          code: normalizedCode,
          label: normalizedLabel,
          numericValue,
          isActive: draft.isActive,
          sortOrder,
        });
      }

      await loadEntries();
      setSavedMessage(
        `${editingEntry ? 'Updated' : 'Created'} ${title.toLowerCase()} entry.`,
      );
      setIsDialogOpen(false);
    } catch {
      setDialogError('Unable to save this settings entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entry: SettingsListEntry): Promise<void> => {
    setSavedMessage(null);
    try {
      await deleteSettingsEntry(listType, entry.id);
      await loadEntries();
      setSavedMessage(`Removed ${entry.code} from ${title.toLowerCase()}.`);
    } catch {
      setLoadError(`Unable to delete ${entry.code}.`);
    }
  };

  const tableColumns = useMemo<Array<TableColumn<SettingsListEntry>>>(() => {
    const columns: Array<TableColumn<SettingsListEntry>> = [
      {
        header: 'Code',
        width: '140px',
        cell: (entry) => <span className="mono">{entry.code}</span>,
      },
      {
        header: 'Label',
        cell: (entry) => entry.label,
      },
    ];

    if (numericField) {
      columns.push({
        header: numericField.label,
        width: '140px',
        align: 'right',
        cell: (entry) => (
          <span className="mono">
            {entry.numericValue === null
              ? '-'
              : `${entry.numericValue}${numericField.suffix ?? ''}`}
          </span>
        ),
      });
    }

    columns.push(
      {
        header: 'Status',
        width: '120px',
        cell: (entry) => (
          <Badge tone={entry.isActive ? 'success' : 'warning'}>
            {entry.isActive ? 'active' : 'inactive'}
          </Badge>
        ),
      },
      {
        header: 'Sort',
        width: '90px',
        align: 'right',
        cell: (entry) => <span className="mono">{entry.sortOrder}</span>,
      },
      {
        header: 'Actions',
        width: '210px',
        cell: (entry) => (
          <div className="badge-row">
            <Button tone="secondary" onClick={() => openEditDialog(entry)}>
              Edit
            </Button>
            <Button tone="danger" onClick={() => void handleDelete(entry)}>
              Remove
            </Button>
          </div>
        ),
      },
    );

    return columns;
  }, [numericField]);

  return (
    <>
      <SettingsTemplate
        eyebrow="Settings"
        title={title}
        description={description}
        actions={
          <Button tone="primary" onClick={openCreateDialog}>
            Add entry
          </Button>
        }
        form={
          <div className="page-stack">
            {savedMessage ? <Notice title="Saved">{savedMessage}</Notice> : null}
            {loadError ? (
              <Notice title="Unable to load" tone="warning">
                {loadError}
              </Notice>
            ) : null}
            <Toolbar>
              <ToolbarGroup>
                <span className="muted-copy">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </ToolbarGroup>
              <ToolbarGroup>
                <Button tone="secondary" onClick={() => void loadEntries()}>
                  Refresh
                </Button>
              </ToolbarGroup>
            </Toolbar>
            {isLoading ? (
              <p>Loading {title.toLowerCase()}...</p>
            ) : (
              <DataTable
                caption={`Simple list CRUD for ${title.toLowerCase()} in the active MVP scope.`}
                columns={tableColumns}
                rows={entries}
                getRowKey={(entry) => String(entry.id)}
                emptyState={
                  <EmptyState
                    title={`No ${title.toLowerCase()} yet`}
                    description="Add the first entry to make it available in commercial and shipping workflows."
                    action={
                      <Button tone="primary" onClick={openCreateDialog}>
                        Add first entry
                      </Button>
                    }
                  />
                }
              />
            )}
          </div>
        }
        aside={
          <Notice title="MVP guardrail">
            Keep this screen as compact list CRUD only. No workflow engines or advanced rule layers are introduced in this slice.
          </Notice>
        }
      />

      {isDialogOpen ? (
        <div className="dialog-backdrop">
          <DialogFrame
            title={editingEntry ? `Edit ${title.toLowerCase()} entry` : `Add ${title.toLowerCase()} entry`}
            description="Update code, label, status, and optional numeric value."
            footer={
              <>
                <Button tone="secondary" onClick={closeDialog} disabled={isSaving}>
                  Cancel
                </Button>
                <Button tone="primary" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save entry'}
                </Button>
              </>
            }
          >
            <div className="page-stack">
              {dialogError ? (
                <Notice title="Cannot save" tone="warning">
                  {dialogError}
                </Notice>
              ) : null}

              <FormGrid columns={2}>
                <Field label="Code">
                  <input
                    className="control mono"
                    value={draft.code}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        code: event.target.value,
                      }))
                    }
                    placeholder="NET30"
                  />
                </Field>
                <Field label="Label">
                  <input
                    className="control"
                    value={draft.label}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        label: event.target.value,
                      }))
                    }
                    placeholder="Net 30 days"
                  />
                </Field>
                {numericField ? (
                  <Field label={numericField.label}>
                    <input
                      className="control mono"
                      value={draft.numericValue}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          numericValue: event.target.value,
                        }))
                      }
                      placeholder={numericField.placeholder}
                    />
                  </Field>
                ) : null}
                <Field label="Sort order">
                  <input
                    className="control mono"
                    value={draft.sortOrder}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        sortOrder: event.target.value,
                      }))
                    }
                    placeholder="10"
                  />
                </Field>
                <Field label="Active">
                  <label className="link-list__item">
                    <span className="muted-copy">Entry is active in document defaults</span>
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          isActive: event.target.checked,
                        }))
                      }
                    />
                  </label>
                </Field>
              </FormGrid>
            </div>
          </DialogFrame>
        </div>
      ) : null}
    </>
  );
}

export const SettingsListPreviewPage = SettingsListPage;
