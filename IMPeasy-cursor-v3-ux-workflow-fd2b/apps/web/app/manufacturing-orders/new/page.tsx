'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createBom,
  createBomItem,
  createManufacturingOrder,
  createRouting,
  createRoutingOperation,
  generateManufacturingOrdersForSalesOrder,
  listBomItems,
  listBomsByItem,
  listItems,
  listManufacturedItems,
  listRoutingOperations,
  listRoutingsByItem,
  listSalesOrders,
  setBomAsDefault,
  setRoutingAsDefault,
  updateManufacturedItem,
  updateRoutingOperation,
} from '../../../lib/api';
import { InlineCreateItemDialog } from '../../../components/inline-create-item-dialog';
import { InlineCreateProductGroupDialog } from '../../../components/inline-create-product-group-dialog';
import type { Item } from '../../../types/item';
import type { SalesOrder } from '../../../types/sales-order';

type CreateMode = 'direct' | 'from-order';

type BomRowState = {
  id: string;
  itemId: string;
  quantity: string;
  rowOrder: number;
  notes: string;
  itemCode?: string;
  itemName?: string;
  itemGroup?: string;
  unitOfMeasure?: string;
};

type RoutingRowState = {
  id: string;
  sequence: string;
  name: string;
  description: string;
  workstation: string;
  setupTimeMinutes: string;
  runTimeMinutes: string;
};

export default function NewManufacturingOrderPage(): JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>('direct');
  const [items, setItems] = useState<Item[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [dueDate, setDueDate] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [bomRows, setBomRows] = useState<BomRowState[]>([]);
  const [routingRows, setRoutingRows] = useState<RoutingRowState[]>([]);
  const [editingRoutingRowId, setEditingRoutingRowId] = useState<string | null>(null);
  const [existingBomId, setExistingBomId] = useState<number | null>(null);
  const [existingRoutingId, setExistingRoutingId] = useState<number | null>(null);
  const [newBomItemId, setNewBomItemId] = useState('');
  const [newBomQuantity, setNewBomQuantity] = useState('1');
  const [newBomNotes, setNewBomNotes] = useState('');
  const [newRoutingSeq, setNewRoutingSeq] = useState('10');
  const [newRoutingName, setNewRoutingName] = useState('');
  const [newRoutingWorkstation, setNewRoutingWorkstation] = useState('');
  const [newRoutingSetup, setNewRoutingSetup] = useState('0');
  const [newRoutingRun, setNewRoutingRun] = useState('0');
  const [loading, setLoading] = useState(true);
  const [loadingBomRouting, setLoadingBomRouting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [addProductGroupDialogOpen, setAddProductGroupDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [extraProductGroups, setExtraProductGroups] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [itemsRes, ordersRes] = await Promise.all([
          listManufacturedItems(),
          listSalesOrders(),
        ]);
        setItems(itemsRes);
        setSalesOrders(ordersRes.filter((o) => ['released', 'in_production'].includes(o.status)));
      } catch {
        setError('Unable to load data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadBomAndRouting = useCallback(async (itemId: number) => {
    setLoadingBomRouting(true);
    setExistingBomId(null);
    setExistingRoutingId(null);
    try {
      const [boms, routings] = await Promise.all([
        listBomsByItem(itemId),
        listRoutingsByItem(itemId),
      ]);
      const defaultBom = boms.find((b) => b.status === 'active') ?? boms[0];
      const defaultRouting = routings.find((r) => r.status === 'active') ?? routings[0];

      if (defaultBom) {
        setExistingBomId(defaultBom.id);
        const bomItems = await listBomItems(defaultBom.id);
        const allItems = await listItems();
        setBomRows(
          bomItems.map((bi) => {
            const item = allItems.find((i) => i.id === bi.itemId);
            return {
              id: `bom-${bi.id}`,
              itemId: String(bi.itemId),
              quantity: String(bi.quantity),
              rowOrder: bi.rowOrder,
              notes: bi.notes ?? '',
              itemCode: bi.itemCode,
              itemName: bi.itemName,
              itemGroup: item?.itemGroup ?? undefined,
              unitOfMeasure: bi.unitOfMeasure,
            };
          }),
        );
      } else {
        setBomRows([]);
      }

      if (defaultRouting) {
        setExistingRoutingId(defaultRouting.id);
        const ops = await listRoutingOperations(defaultRouting.id);
        setRoutingRows(
          ops.map((op) => ({
            id: `routing-${op.id}`,
            sequence: String(op.sequence),
            name: op.name,
            description: op.description ?? '',
            workstation: op.workstation ?? '',
            setupTimeMinutes: String(op.setupTimeMinutes),
            runTimeMinutes: String(op.runTimeMinutes),
          })),
        );
      } else {
        setRoutingRows([]);
      }
    } catch {
      setBomRows([]);
      setRoutingRows([]);
    } finally {
      setLoadingBomRouting(false);
    }
  }, []);

  useEffect(() => {
    if (selectedItemId && Number(selectedItemId) > 0) {
      void loadBomAndRouting(Number(selectedItemId));
    } else {
      setBomRows([]);
      setRoutingRows([]);
    }
  }, [selectedItemId, loadBomAndRouting]);

  const productGroups = useMemo(
    () =>
      Array.from(
        new Set([
          ...items.map((i) => i.itemGroup).filter(Boolean),
          ...extraProductGroups,
        ]),
      ).sort() as string[],
    [items, extraProductGroups],
  );
  const itemsInGroup = useMemo(
    () =>
      selectedGroup ? items.filter((i) => i.itemGroup === selectedGroup) : items,
    [items, selectedGroup],
  );
  const selectedItem = useMemo(
    () => items.find((i) => String(i.id) === selectedItemId),
    [items, selectedItemId],
  );
  const componentItems = useMemo(
    () => items.filter((i) => i.id !== Number(selectedItemId)),
    [items, selectedItemId],
  );

  function addBomRow(): void {
    if (!newBomItemId || Number(newBomQuantity) < 1) return;
    const item = items.find((i) => String(i.id) === newBomItemId);
    const nextOrder = Math.max(10, ...bomRows.map((r) => r.rowOrder), 0) + 10;
    setBomRows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        itemId: newBomItemId,
        quantity: newBomQuantity,
        rowOrder: nextOrder,
        notes: newBomNotes,
        itemCode: item?.code,
        itemName: item?.name,
        itemGroup: item?.itemGroup ?? undefined,
        unitOfMeasure: item?.unitOfMeasure ?? 'pcs',
      },
    ]);
    setNewBomItemId('');
    setNewBomQuantity('1');
    setNewBomNotes('');
  }

  function removeBomRow(id: string): void {
    setBomRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRoutingRow(): void {
    if (!newRoutingName.trim()) return;
    setRoutingRows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        sequence: newRoutingSeq,
        name: newRoutingName.trim(),
        description: '',
        workstation: newRoutingWorkstation,
        setupTimeMinutes: newRoutingSetup,
        runTimeMinutes: newRoutingRun,
      },
    ]);
    setNewRoutingSeq(String(Number(newRoutingSeq) + 10));
    setNewRoutingName('');
    setNewRoutingWorkstation('');
    setNewRoutingSetup('0');
    setNewRoutingRun('0');
  }

  function removeRoutingRow(id: string): void {
    setRoutingRows((prev) => prev.filter((r) => r.id !== id));
    if (editingRoutingRowId === id) {
      setEditingRoutingRowId(null);
      setNewRoutingSeq('10');
      setNewRoutingName('');
      setNewRoutingWorkstation('');
      setNewRoutingSetup('0');
      setNewRoutingRun('0');
    }
  }

  function startEditRoutingRow(row: RoutingRowState): void {
    setEditingRoutingRowId(row.id);
    setNewRoutingSeq(row.sequence);
    setNewRoutingName(row.name);
    setNewRoutingWorkstation(row.workstation);
    setNewRoutingSetup(row.setupTimeMinutes);
    setNewRoutingRun(row.runTimeMinutes);
  }

  function saveEditRoutingRow(): void {
    if (!editingRoutingRowId || !newRoutingName.trim()) return;
    setRoutingRows((prev) =>
      prev.map((r) =>
        r.id === editingRoutingRowId
          ? {
              ...r,
              sequence: newRoutingSeq,
              name: newRoutingName.trim(),
              workstation: newRoutingWorkstation,
              setupTimeMinutes: newRoutingSetup,
              runTimeMinutes: newRoutingRun,
            }
          : r,
      ),
    );
    setEditingRoutingRowId(null);
    setNewRoutingSeq('10');
    setNewRoutingName('');
    setNewRoutingWorkstation('');
    setNewRoutingSetup('0');
    setNewRoutingRun('0');
  }

  async function handleDirectCreate(): Promise<void> {
    if (!selectedItemId || !quantity || Number(quantity) < 1) {
      setError('Please select a product and enter a valid quantity.');
      return;
    }
    const itemId = Number(selectedItemId);
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      setError('Selected product not found.');
      return;
    }

    const needsRouting = routingRows.length > 0;
    const needsBom = bomRows.length > 0;
    if (!item.defaultRoutingId && !needsRouting) {
      setError('Add at least one routing operation, or configure a default routing for this product.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let bomId = item.defaultBomId ?? existingBomId;
      let routingId = item.defaultRoutingId ?? existingRoutingId;

      if (needsBom && !bomId) {
        const bom = await createBom({
          itemId,
          name: `${item.name} BOM`,
          description: `BOM for ${item.name}`,
        });
        bomId = bom.id;
        for (let i = 0; i < bomRows.length; i++) {
          const row = bomRows[i];
          await createBomItem(bom.id, {
            itemId: Number(row.itemId),
            quantity: Number(row.quantity),
            rowOrder: row.rowOrder,
            notes: row.notes.trim() || undefined,
          });
        }
        await setBomAsDefault(bom.id);
        await updateManufacturedItem(itemId, { defaultBomId: bomId });
      } else if (existingBomId && bomRows.some((r) => r.id.startsWith('new-'))) {
        for (const row of bomRows) {
          if (row.id.startsWith('new-')) {
            await createBomItem(existingBomId, {
              itemId: Number(row.itemId),
              quantity: Number(row.quantity),
              rowOrder: row.rowOrder,
              notes: row.notes.trim() || undefined,
            });
          }
        }
      }

      if (needsRouting && !routingId) {
        const routing = await createRouting({
          itemId,
          name: `${item.name} Routing`,
          description: `Routing for ${item.name}`,
        });
        routingId = routing.id;
        for (let i = 0; i < routingRows.length; i++) {
          const row = routingRows[i];
          await createRoutingOperation(routing.id, {
            sequence: Number(row.sequence),
            name: row.name,
            description: row.description.trim() || undefined,
            workstation: row.workstation.trim() || undefined,
            setupTimeMinutes: Number(row.setupTimeMinutes),
            runTimeMinutes: Number(row.runTimeMinutes),
          });
        }
        await setRoutingAsDefault(routing.id);
        await updateManufacturedItem(itemId, { defaultRoutingId: routingId });
      } else if (existingRoutingId) {
        for (const row of routingRows) {
          if (row.id.startsWith('new-')) {
            await createRoutingOperation(existingRoutingId, {
              sequence: Number(row.sequence),
              name: row.name,
              description: row.description.trim() || undefined,
              workstation: row.workstation.trim() || undefined,
              setupTimeMinutes: Number(row.setupTimeMinutes),
              runTimeMinutes: Number(row.runTimeMinutes),
            });
          } else if (row.id.startsWith('routing-')) {
            const opId = Number(row.id.replace('routing-', ''));
            if (!Number.isNaN(opId)) {
              await updateRoutingOperation(existingRoutingId, opId, {
                sequence: Number(row.sequence),
                name: row.name,
                description: row.description.trim() || undefined,
                workstation: row.workstation.trim() || undefined,
                setupTimeMinutes: Number(row.setupTimeMinutes),
                runTimeMinutes: Number(row.runTimeMinutes),
              });
            }
          }
        }
      }

      const created = await createManufacturingOrder({
        itemId,
        quantity: Number(quantity),
        dueDate: dueDate || undefined,
      });
      router.replace(`/manufacturing-orders/${created.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to create manufacturing order. Ensure BOM and routing are valid.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateFromOrder(): Promise<void> {
    if (!selectedOrderId) {
      setError('Please select a customer order.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await generateManufacturingOrdersForSalesOrder(selectedOrderId);
      if (created.length > 0) {
        router.replace(`/manufacturing-orders/${created[0].id}`);
      } else {
        setMessage(
          'No manufacturing orders were generated. Ensure the order has lines with BOM and routing.',
        );
      }
    } catch {
      setError(
        'Unable to generate manufacturing orders. Confirm each line item has a default BOM and routing.',
      );
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Create a manufacturing order
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          component={Link}
          href="/manufacturing-orders"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back
        </Button>
      </Box>

      {error ? (
        <Typography color="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      {message ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>
      ) : null}

      <Tabs value={mode} onChange={(_, v) => setMode(v as CreateMode)} sx={{ mb: 2 }}>
        <Tab label="Direct create" value="direct" />
        <Tab label="From customer order" value="from-order" />
      </Tabs>

      {mode === 'direct' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 2, maxWidth: 520 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create a manufacturing order directly for a product. Add or edit BOM and routing
              below if the product does not have them yet.
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Product group</InputLabel>
              <Select
                value={selectedGroup}
                label="Product group"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__add_new__') {
                    setAddProductGroupDialogOpen(true);
                    setSelectedGroup('');
                  } else {
                    setSelectedGroup(v);
                    setSelectedItemId('');
                  }
                }}
              >
                <MenuItem value="">
                  <em>All groups</em>
                </MenuItem>
                <MenuItem value="__add_new__">
                  <em>Add new product group</em>
                </MenuItem>
                {productGroups.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Product</InputLabel>
              <Select
                value={selectedItemId}
                label="Product"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__add_new__') {
                    setAddProductDialogOpen(true);
                    setSelectedItemId('');
                  } else {
                    setSelectedItemId(v);
                  }
                }}
              >
                <MenuItem value="">
                  <em>Select product</em>
                </MenuItem>
                <MenuItem value="__add_new__">
                  <em>Add new product</em>
                </MenuItem>
                {itemsInGroup.map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    {i.code ?? i.name} — {i.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputProps={{ min: 1 }}
                sx={{ width: 120 }}
              />
              <TextField
                label="Due date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
              />
            </Box>
          </Paper>

          {selectedItemId && (
            <>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Bill of materials
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add component rows for this product. These will be saved as the product BOM if it
                  does not have one yet.
                </Typography>
                {loadingBomRouting ? (
                  <Typography>Loading BOM...</Typography>
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product group</TableCell>
                            <TableCell>Part</TableCell>
                            <TableCell>Notes</TableCell>
                            <TableCell>UoM</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right" />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bomRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.itemGroup ?? '-'}</TableCell>
                              <TableCell>
                                {row.itemCode ?? row.itemName ?? row.itemId}
                                {row.itemName ? ` — ${row.itemName}` : ''}
                              </TableCell>
                              <TableCell>{row.notes || '-'}</TableCell>
                              <TableCell>{row.unitOfMeasure ?? 'pcs'}</TableCell>
                              <TableCell align="right">{row.quantity}</TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  aria-label="Delete BOM row"
                                  onClick={() => removeBomRow(row.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Component</InputLabel>
                        <Select
                          value={newBomItemId}
                          label="Component"
                          onChange={(e) => setNewBomItemId(e.target.value)}
                        >
                          <MenuItem value="">
                            <em>Select component</em>
                          </MenuItem>
                          {componentItems.map((i) => (
                            <MenuItem key={i.id} value={i.id}>
                              {i.code ?? i.name} — {i.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        label="Quantity"
                        type="number"
                        value={newBomQuantity}
                        onChange={(e) => setNewBomQuantity(e.target.value)}
                        inputProps={{ min: 1 }}
                        sx={{ width: 90 }}
                      />
                      <TextField
                        size="small"
                        label="Notes"
                        value={newBomNotes}
                        onChange={(e) => setNewBomNotes(e.target.value)}
                        placeholder="Optional"
                        sx={{ width: 140 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addBomRow}
                        disabled={!newBomItemId || Number(newBomQuantity) < 1}
                      >
                        Add row
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Routing
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add operation rows for this product. These will be saved as the product routing if
                  it does not have one yet.
                </Typography>
                {loadingBomRouting ? (
                  <Typography>Loading routing...</Typography>
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Seq</TableCell>
                            <TableCell>Workstation</TableCell>
                            <TableCell>Operation description</TableCell>
                            <TableCell align="right">Setup time</TableCell>
                            <TableCell align="right">Cycle time</TableCell>
                            <TableCell align="right" />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {routingRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.sequence}</TableCell>
                              <TableCell>{row.workstation || '-'}</TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell align="right">{row.setupTimeMinutes}m</TableCell>
                              <TableCell align="right">{row.runTimeMinutes}m</TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  aria-label="Edit routing row"
                                  onClick={() => startEditRoutingRow(row)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  aria-label="Delete routing row"
                                  onClick={() => removeRoutingRow(row.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
                      <TextField
                        size="small"
                        label="Seq"
                        type="number"
                        value={newRoutingSeq}
                        onChange={(e) => setNewRoutingSeq(e.target.value)}
                        inputProps={{ min: 1 }}
                        sx={{ width: 70 }}
                      />
                      <TextField
                        size="small"
                        label="Operation"
                        value={newRoutingName}
                        onChange={(e) => setNewRoutingName(e.target.value)}
                        placeholder="Operation name"
                        sx={{ width: 180 }}
                      />
                      <TextField
                        size="small"
                        label="Workstation"
                        value={newRoutingWorkstation}
                        onChange={(e) => setNewRoutingWorkstation(e.target.value)}
                        placeholder="Optional"
                        sx={{ width: 130 }}
                      />
                      <TextField
                        size="small"
                        label="Setup (min)"
                        type="number"
                        value={newRoutingSetup}
                        onChange={(e) => setNewRoutingSetup(e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ width: 90 }}
                      />
                      <TextField
                        size="small"
                        label="Run (min)"
                        type="number"
                        value={newRoutingRun}
                        onChange={(e) => setNewRoutingRun(e.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ width: 90 }}
                      />
                      {editingRoutingRowId ? (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={saveEditRoutingRow}
                            disabled={!newRoutingName.trim()}
                          >
                            Update
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setEditingRoutingRowId(null);
                              setNewRoutingSeq('10');
                              setNewRoutingName('');
                              setNewRoutingWorkstation('');
                              setNewRoutingSetup('0');
                              setNewRoutingRun('0');
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={addRoutingRow}
                          disabled={!newRoutingName.trim()}
                        >
                          Add row
                        </Button>
                      )}
                    </Box>
                  </>
                )}
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={() => void handleDirectCreate()}
                  disabled={
                    saving ||
                    !selectedItemId ||
                    !quantity ||
                    Number(quantity) < 1 ||
                    (routingRows.length === 0 && !selectedItem?.defaultRoutingId)
                  }
                >
                  {saving ? 'Creating...' : 'Save'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 2, maxWidth: 480 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manufacturing orders are created from released customer orders. Select a released order
            to generate manufacturing orders for its line items (each item must have a BOM and
            routing).
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Customer Order</InputLabel>
            <Select
              value={selectedOrderId}
              label="Customer Order"
              onChange={(e) => setSelectedOrderId(e.target.value as number | '')}
            >
              <MenuItem value="">
                <em>Select customer order</em>
              </MenuItem>
              {salesOrders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.documentNumber} — {o.customerName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {salesOrders.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No released customer orders available. Release a customer order first from the
              Customer Orders module.
            </Typography>
          ) : null}
          <Button
            variant="contained"
            onClick={() => void handleGenerateFromOrder()}
            disabled={saving || !selectedOrderId}
            sx={{ mt: 1 }}
          >
            {saving ? 'Generating...' : 'Generate'}
          </Button>
        </Paper>
      )}
      <InlineCreateProductGroupDialog
        open={addProductGroupDialogOpen}
        onClose={() => setAddProductGroupDialogOpen(false)}
        onCreated={(g) => {
          setExtraProductGroups((prev) => (prev.includes(g.name) ? prev : [...prev, g.name]));
          setSelectedGroup(g.name);
          setAddProductGroupDialogOpen(false);
        }}
      />
      <InlineCreateItemDialog
        open={addProductDialogOpen}
        onClose={() => setAddProductDialogOpen(false)}
        onCreated={(created) => {
          setItems((prev) => [...prev, created]);
          setSelectedItemId(String(created.id));
          if (created.itemGroup) {
            setExtraProductGroups((prev) =>
              prev.includes(created.itemGroup!) ? prev : [...prev, created.itemGroup!],
            );
          }
          setAddProductDialogOpen(false);
        }}
        asManufactured
      />
    </Box>
  );
}
