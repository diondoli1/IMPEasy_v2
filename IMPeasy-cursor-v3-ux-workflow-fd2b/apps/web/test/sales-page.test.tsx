import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import SalesPage from '../app/sales/page';
import { getSalesReport } from '../lib/api';

vi.mock('../lib/api', () => ({
  getSalesReport: vi.fn(),
}));

const getSalesReportMock = vi.mocked(getSalesReport);

describe('SalesPage', () => {
  beforeEach(() => {
    getSalesReportMock.mockReset();
  });

  it('renders sales summary cards and sales-order rows from the reporting response', async () => {
    getSalesReportMock.mockResolvedValue({
      summary: {
        totalSalesOrders: 2,
        totalOrderedQuantity: 19,
        totalOrderedAmount: 280,
        totalShippedQuantity: 12,
        totalShippedAmount: 160,
        totalInvoiceIssuedAmount: 40,
        totalInvoicePaidAmount: 120,
        totalOutstandingInvoiceAmount: 40,
      },
      orders: [
        {
          salesOrderId: 52,
          quoteId: 17,
          customerId: 8,
          customerName: 'Bravo Fabrication',
          salesOrderStatus: 'invoiced',
          orderedQuantity: 15,
          orderedAmount: 220,
          shippedQuantity: 12,
          shippedAmount: 160,
          invoiceIssuedAmount: 40,
          invoicePaidAmount: 120,
          outstandingInvoiceAmount: 40,
          shipmentCount: 3,
          deliveredShipmentCount: 1,
          invoiceIssuedCount: 1,
          invoicePaidCount: 1,
          createdAt: '2026-03-09T06:00:00.000Z',
          updatedAt: '2026-03-10T07:00:00.000Z',
        },
        {
          salesOrderId: 51,
          quoteId: 16,
          customerId: 7,
          customerName: 'Acme Components',
          salesOrderStatus: 'released',
          orderedQuantity: 4,
          orderedAmount: 60,
          shippedQuantity: 0,
          shippedAmount: 0,
          invoiceIssuedAmount: 0,
          invoicePaidAmount: 0,
          outstandingInvoiceAmount: 0,
          shipmentCount: 0,
          deliveredShipmentCount: 0,
          invoiceIssuedCount: 0,
          invoicePaidCount: 0,
          createdAt: '2026-03-09T04:00:00.000Z',
          updatedAt: '2026-03-10T05:30:00.000Z',
        },
      ],
    });

    render(<SalesPage />);

    expect(screen.getByText('Loading sales report...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sales Report' })).toBeInTheDocument();
    });

    expect(screen.getByText('Total Sales Orders')).toBeInTheDocument();
    expect(screen.getByText('280')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sales order #52' })).toHaveAttribute(
      'href',
      '/sales-orders/52',
    );
    expect(screen.getByText('Bravo Fabrication')).toBeInTheDocument();
    expect(screen.getByText(/Qty 12 \/ Amount 160/)).toBeInTheDocument();
    expect(
      screen.getByText(/Issued 40 \/ Paid 120 \/ Outstanding 40/),
    ).toBeInTheDocument();
  });

  it('renders an empty state when no sales orders exist', async () => {
    getSalesReportMock.mockResolvedValue({
      summary: {
        totalSalesOrders: 0,
        totalOrderedQuantity: 0,
        totalOrderedAmount: 0,
        totalShippedQuantity: 0,
        totalShippedAmount: 0,
        totalInvoiceIssuedAmount: 0,
        totalInvoicePaidAmount: 0,
        totalOutstandingInvoiceAmount: 0,
      },
      orders: [],
    });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText('No sales orders found.')).toBeInTheDocument();
    });
  });

  it('renders an error state when report loading fails', async () => {
    getSalesReportMock.mockRejectedValue(new Error('network error'));

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to load sales report.');
    });
  });
});
