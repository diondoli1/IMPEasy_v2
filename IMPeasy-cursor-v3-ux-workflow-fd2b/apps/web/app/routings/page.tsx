'use client';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { listManufacturedItems } from '../../lib/api';
import type { Item } from '../../types/item';

export default function RoutingsPage(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createPopupOpen, setCreatePopupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listManufacturedItems());
      } catch {
        setError('Unable to load routings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const productGroups = useMemo(
    () => Array.from(new Set(items.map((i) => i.itemGroup).filter(Boolean))).sort() as string[],
    [items],
  );
  const itemsInGroup = useMemo(
    () =>
      selectedGroup
        ? items.filter((i) => i.itemGroup === selectedGroup)
        : items,
    [items, selectedGroup],
  );

  const handleProceed = () => {
    if (selectedItemId) {
      setCreatePopupOpen(false);
      setSelectedGroup('');
      setSelectedItemId('');
      router.push(`/routings/new?itemId=${selectedItemId}`);
    }
  };

  const itemsWithRouting = items.filter((i) => i.defaultRoutingId != null);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading routings...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" role="alert">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Routings</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreatePopupOpen(true);
            setSelectedGroup('');
            setSelectedItemId('');
          }}
        >
          +Create
        </Button>
      </Box>

      <Dialog open={createPopupOpen} onClose={() => setCreatePopupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Routing</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Product group</InputLabel>
            <Select
              value={selectedGroup}
              label="Product group"
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedItemId('');
              }}
            >
              <MenuItem value="">
                <em>Select</em>
              </MenuItem>
              {productGroups.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Product</InputLabel>
            <Select
              value={selectedItemId}
              label="Product"
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <MenuItem value="">
                <em>Select</em>
              </MenuItem>
              {itemsInGroup.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.code} – {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePopupOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProceed} disabled={!selectedItemId}>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Part No</TableCell>
              <TableCell>Part Description</TableCell>
              <TableCell>Group number</TableCell>
              <TableCell>Group name</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {itemsWithRouting.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.defaultRoutingId}</TableCell>
                <TableCell>{item.defaultRoutingName ?? '-'}</TableCell>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.itemGroup ?? '-'}</TableCell>
                <TableCell>{item.itemGroup ?? '-'}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Edit routing"
                    onClick={() => router.push(`/routings/${item.defaultRoutingId}`)}
                  >
                    <EditIcon fontSize="small" />
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
