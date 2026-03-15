import React from 'react';
import { render, screen } from '@testing-library/react';

import { SalesOrderDetailView } from '../components/sales-order-detail';
import type { SalesOrderDetail } from '../types/sales-order';

describe('SalesOrderDetailView', () => {
  it('renders sales order header fields and line rows', () => {
    const salesOrder: SalesOrderDetail = {
      id: 10,
      quoteId: 5,
      customerId: 2,
      status: 'draft',
      createdAt: '2026-03-10T11:00:00.000Z',
      updatedAt: '2026-03-10T11:00:00.000Z',
      salesOrderLines: [
        {
          id: 1,
          salesOrderId: 10,
          itemId: 7,
          quantity: 4,
          unitPrice: 9.5,
          lineTotal: 38,
          createdAt: '2026-03-10T11:00:00.000Z',
          updatedAt: '2026-03-10T11:00:00.000Z',
        },
      ],
    };

    render(<SalesOrderDetailView salesOrder={salesOrder} />);

    expect(screen.getByRole('heading', { name: 'Sales Order #10' })).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('9.50')).toBeInTheDocument();
    expect(screen.getByText('38.00')).toBeInTheDocument();
  });

  it('renders empty-line state when no lines exist', () => {
    const salesOrder: SalesOrderDetail = {
      id: 10,
      quoteId: 5,
      customerId: 2,
      status: 'draft',
      createdAt: '2026-03-10T11:00:00.000Z',
      updatedAt: '2026-03-10T11:00:00.000Z',
      salesOrderLines: [],
    };

    render(<SalesOrderDetailView salesOrder={salesOrder} />);
    expect(screen.getByText('No sales order lines found.')).toBeInTheDocument();
  });
});
