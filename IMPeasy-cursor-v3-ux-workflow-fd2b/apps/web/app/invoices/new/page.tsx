'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import React from 'react';

export default function NewInvoicePage(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Create Invoice
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Invoices are created from delivered shipments. Use the shipment detail page to create an invoice.
      </Typography>
      <Button component={Link} href="/invoices" variant="outlined">
        Back to Invoices
      </Button>
    </Box>
  );
}
