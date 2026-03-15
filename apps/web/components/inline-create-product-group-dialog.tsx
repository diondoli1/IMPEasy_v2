'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MuiButton from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import React, { useState } from 'react';

import { createProductGroup } from '../lib/api';
import type { ProductGroup } from '../types/stock-settings';

type InlineCreateProductGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (group: ProductGroup) => void;
};

export function InlineCreateProductGroupDialog({
  open,
  onClose,
  onCreated,
}: InlineCreateProductGroupDialogProps): JSX.Element {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = (): void => {
    setName('');
    setError(null);
    onClose();
  };

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createProductGroup({ name: name.trim() });
      setName('');
      onCreated(created);
      onClose();
    } catch {
      setError('Unable to create product group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleBack} maxWidth="xs" fullWidth>
      <DialogTitle>Create Product Group</DialogTitle>
      <DialogContent>
        {error ? <p role="alert" style={{ color: 'var(--color-error)' }}>{error}</p> : null}
        <TextField
          fullWidth
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <MuiButton variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </MuiButton>
        <MuiButton variant="contained" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : 'Save'}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}
