import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import CustomerOrdersPage from '../app/customer-orders/page';
import { listQuotes, listSalesOrders } from '../lib/api';

vi.mock('../lib/api', () => ({
  listQuotes: vi.fn(),
  listSalesOrders: vi.fn(),
}));

const listQuotesMock = vi.mocked(listQuotes);
const listSalesOrdersMock = vi.mocked(listSalesOrders);

describe('CustomerOrdersPage', () => {
  beforeEach(() => {
    listQuotesMock.mockReset();
    listSalesOrdersMock.mockReset();
  });

  it('renders the live customer-orders board from quote and sales-order data', async () => {
    listQuotesMock.mockResolvedValue([
      {
        id: 11,
        customerId: 1,
        customerName: 'Mekano Werkzeugbau',
        customerCode: 'CUS-0001',
        documentNumber: 'Q-00011',
        status: 'approved',
        quoteDate: '2026-03-11T08:00:00.000Z',
        validityDate: '2026-03-31T00:00:00.000Z',
        promisedDate: '2026-03-28T00:00:00.000Z',
        customerReference: 'RFQ-77',
        salespersonName: 'Office User',
        salespersonEmail: 'office@impeasy.local',
        paymentTerm: 'Net 30',
        shippingTerm: 'EXW',
        shippingMethod: 'Courier',
        taxMode: 'exclusive',
        documentDiscountPercent: 5,
        notes: 'Urgent',
        internalNotes: 'Keep visible',
        contactName: 'Anna Meyer',
        contactEmail: 'anna@mekano.test',
        contactPhone: '+49 30 555 0000',
        billingAddress: {},
        shippingAddress: {},
        subtotalAmount: 1000,
        discountAmount: 50,
        taxAmount: 180.5,
        totalAmount: 1130.5,
        linkedSalesOrderId: null,
        createdAt: '2026-03-11T08:00:00.000Z',
        updatedAt: '2026-03-11T08:30:00.000Z',
      },
    ]);
    listSalesOrdersMock.mockResolvedValue([
      {
        id: 21,
        quoteId: 9,
        customerId: 2,
        customerName: 'Atlas Fluidtechnik',
        customerCode: 'CUS-0002',
        documentNumber: 'SO-00021',
        status: 'released',
        orderDate: '2026-03-10T08:00:00.000Z',
        promisedDate: '2026-03-20T00:00:00.000Z',
        customerReference: 'PO-21',
        salespersonName: 'Office User',
        salespersonEmail: 'office@impeasy.local',
        paymentTerm: 'Net 15',
        shippingTerm: 'DAP',
        shippingMethod: 'Freight',
        taxMode: 'exclusive',
        documentDiscountPercent: 0,
        notes: 'Ready',
        internalNotes: null,
        contactName: 'Lena Schulz',
        contactEmail: 'lena@atlas.test',
        contactPhone: '+49 40 222 1000',
        billingAddress: {},
        shippingAddress: {},
        subtotalAmount: 5000,
        discountAmount: 0,
        taxAmount: 950,
        totalAmount: 5950,
        createdAt: '2026-03-10T08:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ]);

    render(<CustomerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Customer orders board' })).toBeInTheDocument();
    });

    expect(screen.getByText('Board')).toBeInTheDocument();
    expect(screen.getByText(/Mekano Werkzeugbau/)).toBeInTheDocument();
    expect(screen.getByText(/Atlas Fluidtechnik/)).toBeInTheDocument();
    expect(screen.getByText('Q-00011')).toBeInTheDocument();
    expect(screen.getByText('SO-00021')).toBeInTheDocument();
    const workspaceLinks = screen.getAllByRole('link').filter(
      (el) =>
        el.getAttribute('href')?.includes('/customer-orders/quote-') ||
        el.getAttribute('href')?.includes('/customer-orders/sales-order-'),
    );
    expect(workspaceLinks.length).toBeGreaterThanOrEqual(2);
  });
});
