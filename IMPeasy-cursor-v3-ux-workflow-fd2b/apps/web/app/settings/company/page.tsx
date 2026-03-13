'use client';

import React, { useEffect, useState } from 'react';

import { getCompanySettings, updateCompanySettings } from '../../../lib/api';
import type { CompanySettingInput } from '../../../types/settings';
import { SettingsTemplate } from '../../../components/ui/page-templates';
import { Button, Field, FormGrid, Notice, Panel } from '../../../components/ui/primitives';

type CompanyDraft = Required<CompanySettingInput>;

function createEmptyCompanyDraft(): CompanyDraft {
  return {
    companyName: '',
    legalName: null,
    address: null,
    phone: null,
    email: null,
    website: null,
    taxNumber: null,
  };
}

function toNullableString(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export default function CompanySettingsPage(): JSX.Element {
  const [draft, setDraft] = useState<CompanyDraft>(createEmptyCompanyDraft());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const companySettings = await getCompanySettings();
        if (isCancelled) {
          return;
        }

        setDraft({
          companyName: companySettings.companyName,
          legalName: companySettings.legalName,
          address: companySettings.address,
          phone: companySettings.phone,
          email: companySettings.email,
          website: companySettings.website,
          taxNumber: companySettings.taxNumber,
        });
      } catch {
        if (!isCancelled) {
          setError('Unable to load company settings.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const setDraftValue = (key: keyof CompanyDraft, value: string): void => {
    if (key === 'companyName') {
      setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
      return;
    }

    setDraft((currentDraft) => ({ ...currentDraft, [key]: toNullableString(value) }));
  };

  const saveCompanySettings = async (): Promise<void> => {
    const companyName = draft.companyName.trim();
    if (!companyName) {
      setError('Company name is required.');
      return;
    }

    setError(null);
    setSavedMessage(null);
    setIsSaving(true);

    try {
      const updated = await updateCompanySettings({
        companyName,
        legalName: draft.legalName,
        address: draft.address,
        phone: draft.phone,
        email: draft.email,
        website: draft.website,
        taxNumber: draft.taxNumber,
      });

      setDraft({
        companyName: updated.companyName,
        legalName: updated.legalName,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        website: updated.website,
        taxNumber: updated.taxNumber,
      });
      setSavedMessage('Company settings saved.');
    } catch {
      setError('Unable to save company settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsTemplate
      eyebrow="Settings"
      title="Company details"
      description="Compact admin form for company identity and document header defaults."
      actions={
        <Button tone="primary" onClick={() => void saveCompanySettings()} disabled={isSaving || isLoading}>
          {isSaving ? 'Saving...' : 'Save company'}
        </Button>
      }
      form={
        isLoading ? (
          <p>Loading company settings...</p>
        ) : (
          <div className="page-stack">
            {error ? (
              <Notice title="Unable to save" tone="warning">
                {error}
              </Notice>
            ) : null}
            {savedMessage ? <Notice title="Saved">{savedMessage}</Notice> : null}
            <FormGrid columns={2}>
              <Field label="Company name">
                <input
                  className="control"
                  value={draft.companyName}
                  onChange={(event) => setDraftValue('companyName', event.target.value)}
                />
              </Field>
              <Field label="Legal name">
                <input
                  className="control"
                  value={draft.legalName ?? ''}
                  onChange={(event) => setDraftValue('legalName', event.target.value)}
                />
              </Field>
              <Field label="Address">
                <textarea
                  className="control"
                  value={draft.address ?? ''}
                  onChange={(event) => setDraftValue('address', event.target.value)}
                />
              </Field>
              <div className="page-stack">
                <Field label="Phone">
                  <input
                    className="control"
                    value={draft.phone ?? ''}
                    onChange={(event) => setDraftValue('phone', event.target.value)}
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="control"
                    value={draft.email ?? ''}
                    onChange={(event) => setDraftValue('email', event.target.value)}
                  />
                </Field>
                <Field label="Website">
                  <input
                    className="control"
                    value={draft.website ?? ''}
                    onChange={(event) => setDraftValue('website', event.target.value)}
                  />
                </Field>
                <Field label="VAT / tax number">
                  <input
                    className="control mono"
                    value={draft.taxNumber ?? ''}
                    onChange={(event) => setDraftValue('taxNumber', event.target.value)}
                  />
                </Field>
              </div>
            </FormGrid>
          </div>
        )
      }
      aside={
        <Panel title="Checkpoint focus" description="What to verify visually on this page.">
          <Notice title="Dense form review">
            Check field spacing, control sizing, and alignment against the shared settings template.
          </Notice>
        </Panel>
      }
    />
  );
}
