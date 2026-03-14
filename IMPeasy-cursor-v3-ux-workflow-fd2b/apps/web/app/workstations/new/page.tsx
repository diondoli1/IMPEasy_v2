'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import React from 'react';

export default function NewWorkstationPage(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Create Workstation
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Workstation management requires API support. Coming in a future release.
      </Typography>
      <Button component={Link} href="/workstations" variant="outlined">
        Back to Workstations
      </Button>
    </Box>
  );
}
