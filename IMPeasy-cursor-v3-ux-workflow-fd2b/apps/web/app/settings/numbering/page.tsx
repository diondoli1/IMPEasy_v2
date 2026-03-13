'use client';

import React, { useEffect, useState } from 'react';

import { listNumberingSettings, replaceNumberingSettings } from '../../../lib/api';
import type { NumberingDocumentType, NumberingSetting } from '../../../types/settings';
import { SettingsTemplate } from '../../../components/ui/page-templates';
import { Button, DataTable, Notice, Panel } from '../../../components/ui/primitives';

const NUMBERING_LABELS: Record<NumberingDocumentType, string> = {
  customers: 'Customers',
  quotes: 'Quotes',
  sales_orders: 'Sales orders',
  manufacturing_orders: 'Manufacturing orders',
  purchase_orders: 'Purchase orders',
  shipments: 'Shipments',
  invoices: 'Invoices',
  lots: 'Lots',
};

function buildExample(prefix: string, separator: string, padding: number): string {
  const sequence = '1'.padStart(Math.max(1, padding), '0');
  return `${prefix}${separator}${sequence}`;
}

export default function NumberingSettingsPage(): JSX.Element {
  const [settings, setSettings] = useState<NumberingSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadSettings = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedSettings = await listNumberingSettings();
      setSettings(loadedSettings);
    } catch {
      setError('Unable to load numbering settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const updateRow = (
    id: number,
    field: 'prefix' | 'separator' | 'padding',
    value: string,
  ): void => {
    setSettings((currentSettings) =>
      currentSettings.map((setting) => {
        if (setting.id !== id) {
          return setting;
        }

        if (field === 'padding') {
          const parsed = Number.parseInt(value, 10);
          return {
            ...setting,
            padding: Number.isFinite(parsed) && parsed > 0 ? parsed : setting.padding,
          };
        }

        return {
          ...setting,
          [field]: value,
        };
      }),
    );
  };

  const saveSettings = async (): Promise<void> => {
    if (settings.some((setting) => setting.prefix.trim().length === 0)) {
      setError('Every document type requires a prefix.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      const updated = await replaceNumberingSettings(
        settings.map((setting) => ({
          documentType: setting.documentType,
          prefix: setting.prefix.trim(),
          separator: setting.separator,
          padding: Math.max(1, setting.padding),
        })),
      );
      setSettings(updated);
      setSavedMessage('Numbering settings saved.');
    } catch {
      setError('Unable to save numbering settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsTemplate
      eyebrow="Settings"
      title="Numbering formats"
      description="Sequential numbering for the full MVP document set."
      actions={
        <Button tone="primary" onClick={() => void saveSettings()} disabled={isLoading || isSaving}>
          {isSaving ? 'Saving...' : 'Save numbering'}
        </Button>
      }
      form={
        <div className="page-stack">
          {error ? (
            <Notice title="Unable to save" tone="warning">
              {error}
            </Notice>
          ) : null}
          {savedMessage ? <Notice title="Saved">{savedMessage}</Notice> : null}
          {isLoading ? (
            <p>Loading numbering settings...</p>
          ) : (
            <DataTable
              caption="Prefix, separator, and zero-padding are configurable per document type."
              columns={[
                {
                  header: 'Document type',
                  cell: (row) => NUMBERING_LABELS[row.documentType],
                },
                {
                  header: 'Prefix',
                  width: '140px',
                  cell: (row) => (
                    <input
                      className="control mono"
                      value={row.prefix}
                      onChange={(event) => updateRow(row.id, 'prefix', event.target.value)}
                    />
                  ),
                },
                {
                  header: 'Separator',
                  width: '120px',
                  cell: (row) => (
                    <input
                      className="control mono"
                      value={row.separator}
                      onChange={(event) => updateRow(row.id, 'separator', event.target.value)}
                    />
                  ),
                },
                {
                  header: 'Padding',
                  width: '110px',
                  cell: (row) => (
                    <input
                      className="control mono"
                      value={row.padding}
                      onChange={(event) => updateRow(row.id, 'padding', event.target.value)}
                    />
                  ),
                },
                {
                  header: 'Example',
                  width: '190px',
                  cell: (row) => (
                    <span className="mono">
                      {buildExample(row.prefix, row.separator, row.padding)}
                    </span>
                  ),
                },
              ]}
              rows={settings}
              getRowKey={(row) => String(row.id)}
            />
          )}
        </div>
      }
      aside={
        <>
          <Notice title="Contract guardrail">
            Keep numbering simple and sequential. No branch, site, or workflow-driven variants are added in MVP-050.
          </Notice>
          <Panel title="Visual focus" description="Dense table behavior to compare during checkpoint.">
            <p className="muted-copy">
              Verify monospace treatment, compact headers, and cell input alignment.
            </p>
          </Panel>
        </>
      }
    />
  );
}
