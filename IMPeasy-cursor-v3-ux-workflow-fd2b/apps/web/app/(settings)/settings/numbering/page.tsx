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

const STATIC_NUMBERING: Array<{ label: string; code: string }> = [
  { label: 'Customer orders', code: 'CO00010' },
  { label: 'Customers', code: 'CU00002' },
  { label: 'Invoices', code: 'I00003' },
  { label: 'Pro-forma invoices', code: 'PI00000' },
  { label: 'Quotations', code: 'Q00000' },
  { label: 'Order confirmations', code: 'OC00000' },
  { label: 'Manufacturing orders', code: 'MO00003' },
  { label: 'Workstations', code: 'C00000' },
  { label: 'Workstation groups', code: 'WCT00002' },
  { label: 'BOM', code: 'BO00003' },
  { label: 'Routings', code: 'R00003' },
  { label: 'Items', code: 'A00014' },
  { label: 'Shipments', code: 'S00003' },
  { label: 'Product group', code: 'AG00003' },
  { label: 'Purchase orders', code: 'PO00003' },
];

export default function NumberingFormatsPage(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Numbering formats
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Static codes used by the application. Unchangeable.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document type</TableCell>
              <TableCell>Code</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {STATIC_NUMBERING.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell>
                  <Typography component="span" sx={{ fontFamily: 'monospace' }}>
                    {row.code}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
