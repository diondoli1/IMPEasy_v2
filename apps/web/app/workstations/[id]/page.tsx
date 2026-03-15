'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  getWorkstation,
  listWorkstationGroups,
  updateWorkstation,
} from '../../../lib/api';
import type { WorkstationGroup } from '../../../types/workstation';

export default function WorkstationDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [groups, setGroups] = useState<WorkstationGroup[]>([]);
  const [groupId, setGroupId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [ws, gs] = await Promise.all([
          getWorkstation(id),
          listWorkstationGroups(),
        ]);
        setGroups(gs);
        setGroupId(ws.workstationGroupId);
        setName(ws.name);
        setType(ws.type ?? '');
        setHourlyRate(ws.hourlyRate);
      } catch {
        setError('Workstation not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSave(): Promise<void> {
    if (!groupId || !name.trim()) {
      setError('Name and workstation group are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateWorkstation(id, {
        workstationGroupId: groupId,
        name: name.trim(),
        type: type.trim() || undefined,
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
        <Button component={Link} href="/workstations" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Workstation
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          component={Link}
          href="/workstations"
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
        <FormControl fullWidth required>
          <InputLabel>Workstation Group</InputLabel>
          <Select
            value={groupId}
            label="Workstation Group"
            onChange={(e) => setGroupId(e.target.value as number | '')}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField label="Type" value={type} onChange={(e) => setType(e.target.value)} />
        <TextField
          label="Hourly Rate"
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={hourlyRate}
          onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
        />
      </Box>
    </Box>
  );
}
