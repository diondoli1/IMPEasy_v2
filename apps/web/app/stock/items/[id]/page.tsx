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
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  getItem,
  listProductGroups,
  listUnitOfMeasures,
  updateItem,
} from '../../../../lib/api';
import { InlineCreateProductGroupDialog } from '../../../../components/inline-create-product-group-dialog';
import type { ProductGroup } from '../../../../types/stock-settings';
import { SCROLLABLE_SELECT_MENU_PROPS } from '../../../../lib/select-utils';
import type { UnitOfMeasure } from '../../../../types/stock-settings';

const FALLBACK_UOM = ['pcs', 'kg', 'm', 'L', 'h', 'box', 'pallet'];

export default function StockItemEditPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [partNo, setPartNo] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [productGroup, setProductGroup] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('pcs');
  const [isProcured, setIsProcured] = useState(true);
  const [sellingPrice, setSellingPrice] = useState('');
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([]);
  const [addProductGroupDialogOpen, setAddProductGroupDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [itemData, groups, units] = await Promise.all([
          getItem(id),
          listProductGroups(),
          listUnitOfMeasures(),
        ]);
        setPartNo(itemData.code ?? '');
        setPartDesc(itemData.name ?? '');
        setProductGroup(itemData.itemGroup ?? '');
        setUnitOfMeasure(itemData.unitOfMeasure ?? 'pcs');
        setIsProcured(itemData.itemType === 'procured');
        setSellingPrice(String(itemData.defaultPrice ?? ''));
        setProductGroups(groups);
        setUnitOfMeasures(units);
      } catch {
        setError('Stock item not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const uomOptions =
    unitOfMeasures.length > 0 ? unitOfMeasures.map((u) => u.name) : FALLBACK_UOM;

  const handleSave = async (): Promise<void> => {
    if (!partDesc.trim()) {
      setError('Part description is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      await updateItem(id, {
        code: partNo.trim() || undefined,
        name: partDesc.trim(),
        description: partDesc.trim(),
        itemGroup: productGroup.trim() || undefined,
        unitOfMeasure,
        itemType: isProcured ? 'procured' : 'produced',
        defaultPrice: Number(sellingPrice) || 0,
      });
      setSaveMessage('Item saved.');
    } catch {
      setError('Unable to update item.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading stock item...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">
          {error}
        </Typography>
        <Button component={Link} href="/stock/items" variant="outlined" sx={{ mt: 2 }}>
          Back to items
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          component={Link}
          href="/stock/items"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        <Typography variant="h6">Edit Item</Typography>
        <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Typography>
      )}
      {saveMessage && (
        <Typography sx={{ mb: 2, color: 'success.main' }}>
          {saveMessage}
        </Typography>
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
                if (v === '__add_new__') {
                  setAddProductGroupDialogOpen(true);
                } else {
                  setProductGroup(v);
                }
              }}
              MenuProps={SCROLLABLE_SELECT_MENU_PROPS}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="__add_new__">
                <em>Add new product group</em>
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
              MenuProps={SCROLLABLE_SELECT_MENU_PROPS}
            >
              {uomOptions.map((uom) => (
                <MenuItem key={uom} value={uom}>
                  {uom}
                </MenuItem>
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
      <InlineCreateProductGroupDialog
        open={addProductGroupDialogOpen}
        onClose={() => setAddProductGroupDialogOpen(false)}
        onCreated={(created) => {
          setProductGroups((prev) => [...prev, created]);
          setProductGroup(created.name);
          setAddProductGroupDialogOpen(false);
        }}
      />
    </Box>
  );
}
