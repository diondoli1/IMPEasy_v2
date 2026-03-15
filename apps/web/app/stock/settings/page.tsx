'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useState } from 'react';

import {
  createProductGroup,
  createUnitOfMeasure,
  listItems,
  listProductGroups,
  listUnitOfMeasures,
} from '../../../lib/api';
import type { Item } from '../../../types/item';
import type { ProductGroup } from '../../../types/stock-settings';
import type { UnitOfMeasure } from '../../../types/stock-settings';

export default function StockSettingsPage(): JSX.Element {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitBase, setNewUnitBase] = useState('');
  const [newUnitRate, setNewUnitRate] = useState('1');
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [itemsRes, groupsRes, unitsRes] = await Promise.all([
        listItems(),
        listProductGroups(),
        listUnitOfMeasures(),
      ]);
      setItems(itemsRes);
      setProductGroups(groupsRes);
      setUnitOfMeasures(unitsRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const itemGroups = Array.from(
    new Set(items.map((i) => i.itemGroup).filter(Boolean)),
  ).sort() as string[];

  const itemUnits = Array.from(new Set(items.map((i) => i.unitOfMeasure))).sort();

  const apiGroupNames = new Set(productGroups.map((g) => g.name));
  const mergedGroups = [
    ...productGroups.map((g) => ({ number: g.code, name: g.name })),
    ...itemGroups
      .filter((name) => !apiGroupNames.has(name))
      .map((name) => ({ number: '-', name })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const apiUnitNames = new Set(unitOfMeasures.map((u) => u.name));
  const mergedUnits = [
    ...unitOfMeasures.map((u) => ({
      name: u.name,
      conversion:
        u.baseUnit && u.conversionRate !== 1
          ? `1 ${u.name} = ${u.conversionRate} ${u.baseUnit}`
          : `1 ${u.name} = 1 ${u.name}`,
    })),
    ...itemUnits
      .filter((name) => !apiUnitNames.has(name))
      .map((name) => ({ name, conversion: `1 ${name} = 1 ${name}` })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateGroup = async (): Promise<void> => {
    if (!newGroupName.trim()) {
      setGroupError('Name is required.');
      return;
    }
    setGroupSaving(true);
    setGroupError(null);
    try {
      await createProductGroup({ name: newGroupName.trim() });
      setNewGroupName('');
      setShowCreateGroup(false);
      await load();
    } catch {
      setGroupError('Unable to create product group.');
    } finally {
      setGroupSaving(false);
    }
  };

  const handleCreateUnit = async (): Promise<void> => {
    if (!newUnitName.trim()) {
      setUnitError('Name is required.');
      return;
    }
    const rate = parseFloat(newUnitRate);
    if (Number.isNaN(rate) || rate <= 0) {
      setUnitError('Conversion rate must be a positive number.');
      return;
    }
    setUnitSaving(true);
    setUnitError(null);
    try {
      await createUnitOfMeasure({
        name: newUnitName.trim(),
        baseUnit: newUnitBase.trim() || undefined,
        conversionRate: rate,
      });
      setNewUnitName('');
      setNewUnitBase('');
      setNewUnitRate('1');
      setShowCreateUnit(false);
      await load();
    } catch {
      setUnitError('Unable to create unit of measurement.');
    } finally {
      setUnitSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Stock Settings
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Product Groups" />
        <Tab label="Units of measurement" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">Product Groups</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setShowCreateGroup(true);
                setGroupError(null);
                setNewGroupName('');
              }}
            >
              Create product group
            </Button>
          </Box>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Number</TableCell>
                    <TableCell>Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mergedGroups.map((g, idx) => (
                    <TableRow key={g.name}>
                      <TableCell>{g.number}</TableCell>
                      <TableCell>{g.name}</TableCell>
                    </TableRow>
                  ))}
                  {mergedGroups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        No product groups yet. Create one or add items with a group.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">Units of measurement</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setShowCreateUnit(true);
                setUnitError(null);
                setNewUnitName('');
                setNewUnitBase('');
                setNewUnitRate('1');
              }}
            >
              Create
            </Button>
          </Box>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Number</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Unit conversion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mergedUnits.map((u, idx) => (
                    <TableRow key={u.name}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.conversion}</TableCell>
                    </TableRow>
                  ))}
                  {mergedUnits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No units yet. Create one or add items with a unit.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      <Dialog open={showCreateGroup} onClose={() => setShowCreateGroup(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create product group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleCreateGroup()}
          />
          {groupError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }} role="alert">
              {groupError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateGroup(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleCreateGroup()} disabled={groupSaving}>
            {groupSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showCreateUnit} onClose={() => setShowCreateUnit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create unit of measurement</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="e.g. kg"
          />
          <TextField
            margin="dense"
            label="Base unit"
            fullWidth
            value={newUnitBase}
            onChange={(e) => setNewUnitBase(e.target.value)}
            placeholder="e.g. g (for 1 kg = 1000 g)"
          />
          <TextField
            margin="dense"
            label="Conversion rate"
            fullWidth
            type="number"
            inputProps={{ min: 0.0001, step: 0.01 }}
            value={newUnitRate}
            onChange={(e) => setNewUnitRate(e.target.value)}
            placeholder="e.g. 1000"
            helperText="1 [name] = rate [base unit]. Leave base empty for 1:1."
          />
          {unitError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }} role="alert">
              {unitError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateUnit(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleCreateUnit()} disabled={unitSaving}>
            {unitSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
