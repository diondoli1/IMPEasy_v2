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

import { listCustomers } from '../../lib/api';
import { formatDate, getCustomerStatusLabel } from '../../lib/commercial';
import type { Customer } from '../../types/customer';

export default function CustomersPage(): JSX.Element {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setCustomers(await listCustomers());
      } catch {
        setError('Unable to load customers.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading customers...</Typography>
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
        <Typography variant="h6">Customers</Typography>
        <Button
          component={Link}
          href="/customers/new"
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
              <TableCell>Status</TableCell>
              <TableCell>Next contact</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>{customer.code ?? '-'}</TableCell>
                <TableCell>
                  <Typography component="span" fontWeight={600}>
                    {customer.name}
                  </Typography>
                </TableCell>
                <TableCell>{getCustomerStatusLabel(customer.status)}</TableCell>
                <TableCell>{formatDate(customer.nextContact)}</TableCell>
                <TableCell>{customer.phone ?? '-'}</TableCell>
                <TableCell>{customer.email ?? '-'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Edit customer"
                    onClick={() => router.push(`/customers/${customer.id}`)}
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
