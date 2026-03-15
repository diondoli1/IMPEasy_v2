'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import { formatDate } from '../../../lib/commercial';
import { listVendorInvoices } from '../../../lib/api';
import type { VendorInvoice } from '../../../types/vendor-invoice';

export default function ProcurementInvoicesPage(): JSX.Element {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setInvoices(await listVendorInvoices());
      } catch {
        setError('Unable to load incoming invoices.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading incoming invoices...</Typography>
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
      <Typography variant="h6" sx={{ mb: 2 }}>
        Incoming Invoices
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Invoice ID</TableCell>
              <TableCell>Invoice date</TableCell>
              <TableCell>Vendor Number</TableCell>
              <TableCell>Purchase order</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Tax</TableCell>
              <TableCell align="right">Paid sum</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No incoming invoices.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell>{inv.number ?? '-'}</TableCell>
                  <TableCell>{inv.vendorInvoiceId ?? '-'}</TableCell>
                  <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell>{inv.supplierCode ?? inv.supplierId}</TableCell>
                  <TableCell>{inv.purchaseOrderNumber ?? '-'}</TableCell>
                  <TableCell align="right">{inv.totalAmount.toFixed(2)}</TableCell>
                  <TableCell align="right">{inv.taxAmount.toFixed(2)}</TableCell>
                  <TableCell align="right">{inv.paidAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
