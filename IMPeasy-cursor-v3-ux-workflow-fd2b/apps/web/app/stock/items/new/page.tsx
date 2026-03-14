'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  createItem,
  createProductGroup,
  listProductGroups,
  listUnitOfMeasures,
} from '../../../../lib/api';
import type { ProductGroup } from '../../../../types/stock-settings';
import type { UnitOfMeasure } from '../../../../types/stock-settings';

const FALLBACK_UOM = ['pcs', 'kg', 'm', 'L', 'h', 'box', 'pallet'];

export default function NewStockItemPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? undefined;
  const [partNo, setPartNo] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [productGroup, setProductGroup] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('pcs');
  const [isProcured, setIsProcured] = useState(true);
  const [sellingPrice, setSellingPrice] = useState('');
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [groups, units] = await Promise.all([
          listProductGroups(),
          listUnitOfMeasures(),
        ]);
        setProductGroups(groups);
        setUnitOfMeasures(units);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uomOptions = unitOfMeasures.length > 0
    ? unitOfMeasures.map((u) => u.name)
    : FALLBACK_UOM;

  const handleSave = async (): Promise<void> => {
    if (!partDesc.trim()) {
      setError('Part description is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const item = await createItem({
        code: partNo.trim() || undefined,
        name: partDesc.trim(),
        description: partDesc.trim(),
        itemGroup: productGroup.trim() || undefined,
        unitOfMeasure,
        itemType: isProcured ? 'procured' : 'produced',
        defaultPrice: Number(sellingPrice) || 0,
      });
      if (returnTo) {
        router.replace(returnTo);
      } else {
        router.replace(`/stock/items/${item.id}`);
      }
    } catch {
      setError('Unable to create item.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGroup = async (): Promise<void> => {
    if (!newGroupName.trim()) {
      setGroupError('Name is required.');
      return;
    }
    setGroupSaving(true);
    setGroupError(null);
    try {
      const created = await createProductGroup({ name: newGroupName.trim() });
      setProductGroups((prev) => [...prev, created]);
      setProductGroup(created.name);
      setNewGroupName('');
      setShowCreateGroup(false);
    } catch {
      setGroupError('Unable to create product group.');
    } finally {
      setGroupSaving(false);
    }
  };

  if (showCreateGroup) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Create product group
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              setShowCreateGroup(false);
              setNewGroupName('');
              setGroupError(null);
            }}
          >
            Back
          </Button>
        </Box>
        {groupError && (
          <Typography color="error" sx={{ mb: 2 }} role="alert">{groupError}</Typography>
        )}
        <Paper sx={{ p: 2, maxWidth: 520 }}>
          <TextField
            fullWidth
            label="Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={() => void handleCreateGroup()}
            disabled={groupSaving || !newGroupName.trim()}
          >
            {groupSaving ? 'Saving...' : 'Save'}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          component={Link}
          href={returnTo ?? '/stock/items'}
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        <Typography variant="h6">Create Item</Typography>
        <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }} role="alert">{error}</Typography>
      )}

      <Paper sx={{ p: 2, maxWidth: 520 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Part No"
            value={partNo}
            onChange={(e) => setPartNo(e.target.value)}
          />
          <TextField
            label="Part Desc"
            value={partDesc}
            onChange={(e) => setPartDesc(e.target.value)}
            required
          />
          <FormControl>
            <InputLabel>Product group</InputLabel>
            <Select
              value={productGroup}
              label="Product group"
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__create__') {
                  setShowCreateGroup(true);
                } else {
                  setProductGroup(v);
                }
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="__create__">
                <em>Add new group</em>
              </MenuItem>
              {productGroups.map((g) => (
                <MenuItem key={g.id} value={g.name}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Unit of measurement</InputLabel>
            <Select
              value={unitOfMeasure}
              label="Unit of measurement"
              onChange={(e) => setUnitOfMeasure(e.target.value)}
            >
              {uomOptions.map((uom) => (
                <MenuItem key={uom} value={uom}>{uom}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={isProcured}
                onChange={(e) => setIsProcured(e.target.checked)}
              />
            }
            label="This is a procured item"
          />
          <TextField
            label="Selling Price"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
          />
        </Box>
      </Paper>
    </Box>
  );
}
