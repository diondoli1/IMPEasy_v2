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

import { listManufacturedItems } from '../../lib/api';
import type { Item } from '../../types/item';

export default function BomsPage(): JSX.Element {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listManufacturedItems());
      } catch {
        setError('Unable to load BOMs.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const itemsWithBom = items.filter((i) => i.defaultBomId != null);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading BOMs...</Typography>
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
        <Typography variant="h6">BOM</Typography>
        <Button
          component={Link}
          href="/boms/new"
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
              <TableCell>Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Part No</TableCell>
              <TableCell>Part description</TableCell>
              <TableCell>Group number</TableCell>
              <TableCell>Group Name</TableCell>
              <TableCell align="right">Approximate Cost</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {itemsWithBom.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.defaultBomId}</TableCell>
                <TableCell>{item.defaultBomName ?? '-'}</TableCell>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.itemGroup ?? '-'}</TableCell>
                <TableCell>{item.itemGroup ?? '-'}</TableCell>
                <TableCell align="right">-</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Edit BOM"
                    onClick={() => router.push(`/boms/${item.defaultBomId}`)}
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
