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

import { listManufacturedItems, listProductGroups } from '../../lib/api';
import { InlineCreateItemDialog } from '../../components/inline-create-item-dialog';
import { InlineCreateProductGroupDialog } from '../../components/inline-create-product-group-dialog';
import type { Item } from '../../types/item';
import type { ProductGroup } from '../../types/stock-settings';
import { SCROLLABLE_SELECT_MENU_PROPS } from '../../lib/select-utils';

export default function RoutingsPage(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createPopupOpen, setCreatePopupOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [addProductGroupDialogOpen, setAddProductGroupDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [itemData, groupData] = await Promise.all([
          listManufacturedItems(),
          listProductGroups(),
        ]);
        setItems(itemData);
        setProductGroups(groupData);
      } catch {
        setError('Unable to load routings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const productGroupNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...productGroups.map((g) => g.name),
          ...items.map((i) => i.itemGroup).filter(Boolean) as string[],
        ]),
      ).sort(),
    [items, productGroups],
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
                const v = e.target.value;
                if (v === '__add_new__') {
                  setAddProductGroupDialogOpen(true);
                } else {
                  setSelectedGroup(v);
                  setSelectedItemId('');
                }
              }}
              MenuProps={SCROLLABLE_SELECT_MENU_PROPS}
            >
              <MenuItem value="">
                <em>Select product group</em>
              </MenuItem>
              <MenuItem value="__add_new__">
                <em>Add new product group</em>
              </MenuItem>
              {productGroupNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Product</InputLabel>
            <Select
              value={selectedItemId}
              label="Product"
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__add_new__') {
                  setAddProductDialogOpen(true);
                } else {
                  setSelectedItemId(v);
                }
              }}
              MenuProps={SCROLLABLE_SELECT_MENU_PROPS}
            >
              <MenuItem value="">
                <em>Select product</em>
              </MenuItem>
              <MenuItem value="__add_new__">
                <em>Add new product</em>
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
      <InlineCreateProductGroupDialog
        open={addProductGroupDialogOpen}
        onClose={() => setAddProductGroupDialogOpen(false)}
        onCreated={(created) => {
          setProductGroups((prev) => [...prev, created]);
          setSelectedGroup(created.name);
          setAddProductGroupDialogOpen(false);
        }}
      />
      <InlineCreateItemDialog
        open={addProductDialogOpen}
        onClose={() => setAddProductDialogOpen(false)}
        onCreated={(created) => {
          setItems((prev) => [...prev, created]);
          setSelectedItemId(String(created.id));
          setAddProductDialogOpen(false);
        }}
        asManufactured
      />

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
