'use client';

import Link from 'next/link';
import React from 'react';
import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type ButtonLinkProps = {
  children: ReactNode;
  href: string;
  tone?: ButtonTone;
};

export type ButtonProps = {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  tone?: ButtonTone;
  disabled?: boolean;
  onClick?: () => void;
};

export type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export type PanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  muted?: boolean;
  compactHeader?: boolean;
};

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export type NoticeProps = {
  title: string;
  children: ReactNode;
  tone?: 'default' | 'warning';
};

export type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export type TableColumn<Row> = {
  header: string;
  cell: (row: Row) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
};

export type DataTableProps<Row> = {
  caption?: string;
  columns: TableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  emptyState?: ReactNode;
};

export type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
};

export type DialogFrameProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  open?: boolean;
  onClose?: () => void;
};

function toneToMuiColor(tone: ButtonTone): 'primary' | 'secondary' | 'error' | 'inherit' {
  if (tone === 'primary') return 'primary';
  if (tone === 'danger') return 'error';
  return 'secondary';
}

function badgeToneToMuiColor(tone: BadgeTone): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'error';
  if (tone === 'info') return 'info';
  return 'default';
}

export function ButtonLink({ children, href, tone = 'secondary' }: ButtonLinkProps): JSX.Element {
  return (
    <MuiButton component={Link} href={href} color={toneToMuiColor(tone)} variant={tone === 'primary' ? 'contained' : 'outlined'}>
      {children}
    </MuiButton>
  );
}

export function Button({
  children,
  type = 'button',
  tone = 'secondary',
  disabled,
  onClick,
}: ButtonProps): JSX.Element {
  return (
    <MuiButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      color={toneToMuiColor(tone)}
      variant={tone === 'primary' ? 'contained' : 'outlined'}
    >
      {children}
    </MuiButton>
  );
}

export function Badge({ children, tone = 'neutral' }: BadgeProps): JSX.Element {
  return <Chip label={children} color={badgeToneToMuiColor(tone)} size="small" />;
}

export function BadgeRow({ children }: { children: ReactNode }): JSX.Element {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {children}
    </Box>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  muted = false,
}: PanelProps): JSX.Element {
  return (
    <Paper sx={{ p: 2, bgcolor: muted ? 'action.hover' : 'background.paper' }}>
      {(title || description || actions) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            {title && <Typography variant="h6">{title}</Typography>}
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
          {actions && <Box>{actions}</Box>}
        </Box>
      )}
      {children}
    </Paper>
  );
}

export function Toolbar({ children }: { children: ReactNode }): JSX.Element {
  return <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>{children}</Box>;
}

export function ToolbarGroup({ children }: { children: ReactNode }): JSX.Element {
  return <Box sx={{ display: 'flex', gap: 1 }}>{children}</Box>;
}

export function Notice({ title, children, tone = 'default' }: NoticeProps): JSX.Element {
  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        bgcolor: tone === 'warning' ? 'warning.light' : 'info.light',
        borderLeft: 4,
        borderColor: tone === 'warning' ? 'warning.main' : 'info.main',
      }}
    >
      <Typography fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Paper>
  );
}

export function EmptyState({ title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      {action}
    </Box>
  );
}

export function FormGrid({
  children,
  columns = 1,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}): JSX.Element {
  const gridTemplateColumns =
    columns === 3
      ? { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }
      : columns === 2
        ? { xs: '1fr', sm: '1fr 1fr' }
        : '1fr';
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns,
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

export function Field({ label, hint, children }: FieldProps): JSX.Element {
  return (
    <Box
      component="label"
      sx={{ display: 'block', mb: 2, cursor: 'text' }}
    >
      <Typography variant="body2" fontWeight={500} gutterBottom display="block">
        {label}
      </Typography>
      {children}
      {hint && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export function StatGrid({ children }: { children: ReactNode }): JSX.Element {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2, mb: 2 }}>
      {children}
    </Box>
  );
}

export function StatCard({ label, value, hint, href }: StatCardProps): JSX.Element {
  const content = (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    );
  }
  return content;
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  emptyState,
}: DataTableProps<Row>): JSX.Element {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        {caption && (
          <caption style={{ padding: 8, textAlign: 'left' }}>
            {caption}
          </caption>
        )}
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.header} align={col.align} sx={col.width ? { width: col.width } : undefined}>
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                {emptyState ?? (
                  <EmptyState
                    title="Nothing here yet"
                    description="No rows are available in this view."
                  />
                )}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={getRowKey(row)} hover>
                {columns.map((col) => (
                  <TableCell key={col.header} align={col.align}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function DialogFrame({
  title,
  description,
  children,
  footer,
  open = true,
  onClose,
}: DialogFrameProps): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        {children}
      </DialogContent>
      <DialogActions>{footer}</DialogActions>
    </Dialog>
  );
}
