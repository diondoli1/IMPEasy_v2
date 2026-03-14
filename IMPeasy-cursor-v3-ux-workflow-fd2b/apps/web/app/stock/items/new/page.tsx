'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { createItem } from '../../../../lib/api';

const UOM_OPTIONS = ['pcs', 'kg', 'm', 'L', 'h', 'box', 'pallet'];

export default function NewStockItemPage(): JSX.Element {
  const router = useRouter();
  const [partNo, setPartNo] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [productGroup, setProductGroup] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('pcs');
  const [isProcured, setIsProcured] = useState(true);
  const [sellingPrice, setSellingPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.replace(`/items/${item.id}`);
    } catch {
      setError('Unable to create item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Create Item</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            href="/stock/items"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
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
          <TextField
            label="Product group"
            value={productGroup}
            onChange={(e) => setProductGroup(e.target.value)}
          />
          <FormControl>
            <InputLabel>Unit of measurement</InputLabel>
            <Select
              value={unitOfMeasure}
              label="Unit of measurement"
              onChange={(e) => setUnitOfMeasure(e.target.value)}
            >
              {UOM_OPTIONS.map((uom) => (
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
