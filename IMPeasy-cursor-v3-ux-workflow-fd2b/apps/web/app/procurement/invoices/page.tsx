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
import React from 'react';

export default function ProcurementInvoicesPage(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Incoming Invoices
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Incoming invoices (vendor bills) require API support. The table structure will display:
        Number, Invoice ID, Invoice date, Vendor Number, Purchase order, Total, Tax, Paid sum.
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
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">
                  No incoming invoices. API support for vendor invoices is pending.
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
