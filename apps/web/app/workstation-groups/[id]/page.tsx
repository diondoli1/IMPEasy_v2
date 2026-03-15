'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { getWorkstationGroup, updateWorkstationGroup } from '../../../lib/api';

export default function WorkstationGroupDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [name, setName] = useState('');
  const [instanceCount, setInstanceCount] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const g = await getWorkstationGroup(id);
        setName(g.name);
        setInstanceCount(g.instanceCount);
        setHourlyRate(g.hourlyRate);
      } catch {
        setError('Workstation group not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateWorkstationGroup(id, {
        name: name.trim(),
        instanceCount,
        hourlyRate,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error && !name) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">
          {error}
        </Typography>
        <Button component={Link} href="/workstation-groups" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Workstation Group
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          component={Link}
          href="/workstation-groups"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back
        </Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
      {error ? (
        <Typography color="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Number of instances"
          type="number"
          inputProps={{ min: 1, step: 1 }}
          value={instanceCount}
          onChange={(e) => setInstanceCount(Number(e.target.value) || 1)}
        />
        <TextField
          label="Hourly rate"
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={hourlyRate}
          onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
        />
      </Box>
    </Box>
  );
}
