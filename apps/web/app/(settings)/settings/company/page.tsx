'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import { getCompanySettings, updateCompanySettings } from '../../../../lib/api';
import type { CompanySettingInput } from '../../../../types/settings';

function toNullableString(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export default function CompanySettingsPage(): JSX.Element {
  const [draft, setDraft] = useState<Required<CompanySettingInput>>({
    companyName: '',
    legalName: null,
    address: null,
    phone: null,
    email: null,
    website: null,
    taxNumber: null,
    taxRate: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const s = await getCompanySettings();
        setDraft({
          companyName: s.companyName,
          legalName: s.legalName,
          address: s.address,
          phone: s.phone,
          email: s.email,
          website: s.website,
          taxNumber: s.taxNumber,
          taxRate: s.taxRate ?? null,
        });
      } catch {
        setError('Unable to load company settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    const companyName = draft.companyName.trim();
    if (!companyName) {
      setError('Company name is required.');
      return;
    }
    setError(null);
    setSaved(null);
    setSaving(true);
    try {
      const updated = await updateCompanySettings({
        companyName,
        legalName: draft.legalName,
        address: draft.address,
        phone: draft.phone,
        email: draft.email,
        website: draft.website,
        taxNumber: draft.taxNumber,
        taxRate: draft.taxRate,
      });
      setDraft({
        companyName: updated.companyName,
        legalName: updated.legalName,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        website: updated.website,
        taxNumber: updated.taxNumber,
        taxRate: updated.taxRate ?? null,
      });
      setSaved('Company settings saved.');
    } catch {
      setError('Unable to save company settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading company settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Company details</Typography>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Typography>
      )}
      {saved && (
        <Typography color="success.main" sx={{ mb: 2 }}>
          {saved}
        </Typography>
      )}

      <Paper sx={{ p: 3, maxWidth: 560 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Company Name"
            value={draft.companyName}
            onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Legal Address"
            multiline
            rows={2}
            value={draft.address ?? ''}
            onChange={(e) => setDraft((p) => ({ ...p, address: toNullableString(e.target.value) }))}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={draft.email ?? ''}
            onChange={(e) => setDraft((p) => ({ ...p, email: toNullableString(e.target.value) }))}
            fullWidth
          />
          <TextField
            label="Website"
            value={draft.website ?? ''}
            onChange={(e) => setDraft((p) => ({ ...p, website: toNullableString(e.target.value) }))}
            fullWidth
          />
          <TextField
            label="Phone"
            value={draft.phone ?? ''}
            onChange={(e) => setDraft((p) => ({ ...p, phone: toNullableString(e.target.value) }))}
            fullWidth
          />
          <TextField
            label="TAX Number"
            value={draft.taxNumber ?? ''}
            onChange={(e) => setDraft((p) => ({ ...p, taxNumber: toNullableString(e.target.value) }))}
            fullWidth
          />
          <TextField
            label="Tax Rate (%)"
            type="number"
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            value={draft.taxRate ?? ''}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                taxRate: e.target.value === '' ? null : Number(e.target.value),
              }))
            }
            fullWidth
          />
        </Box>
      </Paper>
    </Box>
  );
}
