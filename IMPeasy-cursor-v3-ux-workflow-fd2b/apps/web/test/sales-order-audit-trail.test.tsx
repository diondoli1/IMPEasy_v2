import React from 'react';
import { render, screen } from '@testing-library/react';

import { SalesOrderAuditTrail } from '../components/sales-order-audit-trail';
import type { SalesOrderAudit } from '../types/sales-order';

describe('SalesOrderAuditTrail', () => {
  it('renders audit rows', () => {
    const entries: SalesOrderAudit[] = [
      {
        id: 1,
        salesOrderId: 10,
        action: 'created_from_quote',
        fromStatus: null,
        toStatus: 'draft',
        actor: 'system',
        createdAt: '2026-03-10T12:00:00.000Z',
      },
      {
        id: 2,
        salesOrderId: 10,
        action: 'status_transition',
        fromStatus: 'draft',
        toStatus: 'confirmed',
        actor: 'system',
        createdAt: '2026-03-10T12:05:00.000Z',
      },
    ];

    render(<SalesOrderAuditTrail entries={entries} />);

    expect(screen.getByRole('heading', { name: 'Audit Trail' })).toBeInTheDocument();
    expect(screen.getByText('created_from_quote')).toBeInTheDocument();
    expect(screen.getByText('status_transition')).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<SalesOrderAuditTrail entries={[]} />);
    expect(screen.getByText('No audit entries found.')).toBeInTheDocument();
  });
});
