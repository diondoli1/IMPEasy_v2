'use client';

import SaveIcon from '@mui/icons-material/Save';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import {
  adjustInventoryItem,
  getInventorySummaryReport,
  listItems,
} from '../../../lib/api';
import type { InventorySummaryReportRow } from '../../../types/inventory';
import type { Item } from '../../../types/item';

type RowWithItem = InventorySummaryReportRow & {
  itemCode: string | null;
  itemGroup: string | null;
};

export default function StockInventoryPage(): JSX.Element {
  const [rows, setRows] = useState<RowWithItem[]>([]);
  const [physicalByItem, setPhysicalByItem] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const [report, items] = await Promise.all([
        getInventorySummaryReport(),
        listItems(),
      ]);
      const itemMap = new Map(items.map((i) => [i.id, i]));
      const merged: RowWithItem[] = report.items.map((r) => ({
        ...r,
        itemCode: itemMap.get(r.itemId)?.code ?? null,
        itemGroup: itemMap.get(r.itemId)?.itemGroup ?? null,
      }));
      setRows(merged);
      setPhysicalByItem({});
    } catch {
      setError('Unable to load inventory.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(inventoryItemId: number, row: RowWithItem) {
    const raw = physicalByItem[inventoryItemId]?.trim();
    if (raw === undefined || raw === '') return;
    const physical = Number(raw);
    if (!Number.isFinite(physical) || physical < 0) return;
    const delta = physical - row.quantityOnHand;
    if (delta === 0) return;
    setSavingId(inventoryItemId);
    setError(null);
    try {
      await adjustInventoryItem(inventoryItemId, { delta });
      setPhysicalByItem((prev) => {
        const next = { ...prev };
        delete next[inventoryItemId];
        return next;
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save adjustment.');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading inventory...</Typography>
      </Box>
    );
  }

  if (error && rows.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Inventory
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Part No</TableCell>
              <TableCell>Group number</TableCell>
              <TableCell>Group name</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell>Part description</TableCell>
              <TableCell>Physical quantity</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.inventoryItemId} hover>
                <TableCell>{row.itemCode ?? '-'}</TableCell>
                <TableCell>{row.itemGroup ?? '-'}</TableCell>
                <TableCell>{row.itemGroup ?? '-'}</TableCell>
                <TableCell align="right">{row.quantityOnHand}</TableCell>
                <TableCell align="right">-</TableCell>
                <TableCell>{row.itemName}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    placeholder={String(row.quantityOnHand)}
                    value={physicalByItem[row.inventoryItemId] ?? ''}
                    onChange={(e) =>
                      setPhysicalByItem((prev) => ({
                        ...prev,
                        [row.inventoryItemId]: e.target.value,
                      }))
                    }
                    sx={{ width: 100 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Save"
                    disabled={savingId === row.inventoryItemId}
                    onClick={() => handleSave(row.inventoryItemId, row)}
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
