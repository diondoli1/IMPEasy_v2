'use client';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { formatCurrency } from '../../../lib/commercial';
import { listStockItems } from '../../../lib/api';
import type { StockItem } from '../../../types/inventory';

export default function StockItemsPage(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listStockItems());
      } catch {
        setError('Unable to load stock items.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading stock items...</Typography>
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
        <Typography variant="h6">Items</Typography>
        <Button
          component={Link}
          href="/stock/items/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          +Create
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Part No</TableCell>
              <TableCell>Part Description</TableCell>
              <TableCell>Group number</TableCell>
              <TableCell>Group Name</TableCell>
              <TableCell align="right">In stock</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell align="right">Booked</TableCell>
              <TableCell>UoM</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.itemId} hover>
                <TableCell>{item.itemCode ?? '-'}</TableCell>
                <TableCell>{item.itemName}</TableCell>
                <TableCell>{item.productGroupCode ?? '-'}</TableCell>
                <TableCell>{item.itemGroup ?? '-'}</TableCell>
                <TableCell align="right">{item.onHandQuantity}</TableCell>
                <TableCell align="right">{item.availableQuantity}</TableCell>
                <TableCell align="right">{item.bookedQuantity}</TableCell>
                <TableCell>{item.unitOfMeasure}</TableCell>
                <TableCell align="right">{formatCurrency(item.defaultPrice)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Edit item"
                    onClick={() => router.push(`/stock/items/${item.itemId}`)}
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
