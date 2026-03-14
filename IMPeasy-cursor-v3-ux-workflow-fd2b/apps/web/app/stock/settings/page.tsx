'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import { listItems } from '../../../lib/api';
import type { Item } from '../../../types/item';

export default function StockSettingsPage(): JSX.Element {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await listItems());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const productGroups = Array.from(
    new Set(items.map((i) => i.itemGroup).filter(Boolean)),
  ).sort() as string[];

  const units = Array.from(
    new Set(items.map((i) => i.unitOfMeasure)),
  ).sort();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Stock Settings
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Product Groups" />
        <Tab label="Units of measurement" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Product Groups
          </Typography>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <Box
              component="table"
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': { border: '1px solid', borderColor: 'divider', p: 1.5, textAlign: 'left' },
              }}
            >
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {productGroups.map((name, idx) => (
                  <tr key={name}>
                    <td>{idx + 1}</td>
                    <td>{name}</td>
                  </tr>
                ))}
              </tbody>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Product groups are derived from items. Create product group requires API support.
          </Typography>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Units of measurement
          </Typography>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <Box
              component="table"
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': { border: '1px solid', borderColor: 'divider', p: 1.5, textAlign: 'left' },
              }}
            >
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Name</th>
                  <th>Unit conversion</th>
                </tr>
              </thead>
              <tbody>
                {units.map((name, idx) => (
                  <tr key={name}>
                    <td>{idx + 1}</td>
                    <td>{name}</td>
                    <td>1 {name} = 1 {name}</td>
                  </tr>
                ))}
              </tbody>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Units are derived from items. Create unit requires API support.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
