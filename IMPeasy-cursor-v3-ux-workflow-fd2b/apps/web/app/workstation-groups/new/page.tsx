'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import React from 'react';

export default function NewWorkstationGroupPage(): JSX.Element {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Create Workstation Group
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Workstation group management requires API support. Coming in a future release.
      </Typography>
      <Button component={Link} href="/workstation-groups" variant="outlined">
        Back to Workstation Groups
      </Button>
    </Box>
  );
}
