'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import MuiButton from '@mui/material/Button';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import React, { useEffect, useState } from 'react';
import type { DialogProps } from '@mui/material/Dialog';

import {
  createItem,
  createManufacturedItem,
  getNextItemCode,
  listProductGroups,
  listUnitOfMeasures,
} from '../lib/api';
import { SCROLLABLE_SELECT_MENU_PROPS } from '../lib/select-utils';
import { InlineCreateProductGroupDialog } from './inline-create-product-group-dialog';
import type { Item, ItemInput } from '../types/item';
import type { ProductGroup, UnitOfMeasure } from '../types/stock-settings';

const FALLBACK_UOM = ['pcs', 'kg', 'm', 'L', 'h', 'box', 'pallet'];

type InlineCreateItemDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (item: Item) => void;
  /** Use manufactured item API (for manufacturing orders). Default: createItem (stock items for orders). */
  asManufactured?: boolean;
  /**
   * Optional default product group (e.g. inherited from the active order line).
   * Helps ensure the created item shows up immediately in filtered dropdowns.
   */
  defaultProductGroup?: string;
};

export function InlineCreateItemDialog({
  open,
  onClose,
  onCreated,
  asManufactured = false,
  defaultProductGroup,
}: InlineCreateItemDialogProps): JSX.Element {
  const [partNo, setPartNo] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [productGroup, setProductGroup] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('pcs');
  const [isProcured, setIsProcured] = useState(true);
  const [sellingPrice, setSellingPrice] = useState('');
  const [initialQuantityOnHand, setInitialQuantityOnHand] = useState('');
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const [groups, units, nextCode] = await Promise.all([
          listProductGroups(),
          listUnitOfMeasures(),
          getNextItemCode(),
        ]);
        setProductGroups(groups);
        setUnitOfMeasures(units);
        setPartNo(nextCode);
      } catch {
        // ignore
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fallbackGroup = defaultProductGroup?.trim() ?? '';
    if (fallbackGroup && !productGroup.trim()) {
      setProductGroup(fallbackGroup);
    }
    // Intentionally only runs when opening; avoids overwriting user input mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultProductGroup]);

  const uomOptions = unitOfMeasures.length > 0
    ? unitOfMeasures.map((u) => u.name)
    : FALLBACK_UOM;

  const productGroupNames = productGroups.map((g) => g.name);
  const resolvedProductGroupValue = productGroup.trim();
  const needsEphemeralProductGroupOption =
    resolvedProductGroupValue.length > 0 && !productGroupNames.includes(resolvedProductGroupValue);

  const handleBack = (): void => {
    setPartNo('');
    setPartDesc('');
    setProductGroup('');
    setUnitOfMeasure('pcs');
    setIsProcured(true);
    setSellingPrice('');
    setInitialQuantityOnHand('');
    setShowCreateGroup(false);
    setError(null);
    onClose();
  };

  const handleDialogClose: DialogProps['onClose'] = (_event, reason) => {
    // Prevent accidental close when clicking the grey backdrop or pressing ESC.
    // Users frequently click outside while filling forms; closing would lose progress.
    if (reason === 'backdropClick') {
      return;
    }
    handleBack();
  };

  const handleSave = async (): Promise<void> => {
    if (!partDesc.trim()) {
      setError('Part description is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const qty = initialQuantityOnHand.trim() === '' ? undefined : Number(initialQuantityOnHand);
      const resolvedGroup =
        productGroup.trim() || defaultProductGroup?.trim() || undefined;
      const input: ItemInput = {
        code: partNo.trim() || undefined,
        name: partDesc.trim(),
        description: partDesc.trim(),
        itemGroup: resolvedGroup,
        unitOfMeasure,
        itemType: isProcured ? 'procured' : 'produced',
        defaultPrice: Number(sellingPrice) || 0,
        initialQuantityOnHand: qty != null && !Number.isNaN(qty) && qty >= 0 ? qty : undefined,
      };
      const created = asManufactured
        ? await createManufacturedItem(input)
        : await createItem(input);
      setPartNo('');
      setPartDesc('');
      setProductGroup('');
      setUnitOfMeasure('pcs');
      setIsProcured(true);
      setSellingPrice('');
      setInitialQuantityOnHand('');
      onCreated(created);
      onClose();
    } catch {
      setError('Unable to create item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        data-testid="create-product-dialog"
      >
        <DialogTitle id="create-product-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <span>Create Product</span>
            <IconButton aria-label="Close" onClick={handleBack} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error ? <p role="alert" style={{ color: 'var(--color-error)' }}>{error}</p> : null}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
                    setShowCreateGroup(true);
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
                {needsEphemeralProductGroupOption ? (
                  <MenuItem value={resolvedProductGroupValue}>
                    {resolvedProductGroupValue}
                  </MenuItem>
                ) : null}
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
            <TextField
              label="Initial quantity on hand"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={initialQuantityOnHand}
              onChange={(e) => setInitialQuantityOnHand(e.target.value)}
              placeholder="Optional"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back
          </MuiButton>
          <MuiButton variant="contained" onClick={() => void handleSave()} disabled={saving || !partDesc.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </MuiButton>
        </DialogActions>
      </Dialog>
      <InlineCreateProductGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(g) => {
          setProductGroups((prev) => [...prev, g]);
          setProductGroup(g.name);
          setShowCreateGroup(false);
        }}
      />
    </>
  );
}
