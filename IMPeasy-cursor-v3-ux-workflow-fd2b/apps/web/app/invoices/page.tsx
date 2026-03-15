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

import { listInvoices } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/commercial';
import type { InvoiceRegisterEntry } from '../../types/invoice';

export default function InvoicesPage(): JSX.Element {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setInvoices(await listInvoices());
      } catch {
        setError('Unable to load invoices.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading invoices...</Typography>
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
        <Typography variant="h6">Invoices</Typography>
        <Button
          component={Link}
          href="/invoices/new"
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
              <TableCell>Customer Number</TableCell>
              <TableCell>Customer name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total including tax</TableCell>
              <TableCell align="right">Paid sum</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Due date</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} hover>
                <TableCell>{invoice.number}</TableCell>
                <TableCell>{invoice.customerId}</TableCell>
                <TableCell>{invoice.customerName}</TableCell>
                <TableCell>
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: invoice.status === 'paid' ? 'success.main' : 'text.secondary',
                    }}
                  >
                    {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </Typography>
                </TableCell>
                <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                <TableCell align="right">
                  {invoice.status === 'paid' ? formatCurrency(invoice.totalAmount) : '-'}
                </TableCell>
                <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    aria-label="Edit invoice"
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
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
