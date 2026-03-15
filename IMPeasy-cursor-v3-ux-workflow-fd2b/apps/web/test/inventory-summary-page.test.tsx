import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import InventorySummaryPage from '../app/inventory/page';
import { getInventorySummaryReport } from '../lib/api';

vi.mock('../lib/api', () => ({
  getInventorySummaryReport: vi.fn(),
}));

const getInventorySummaryReportMock = vi.mocked(getInventorySummaryReport);

describe('InventorySummaryPage', () => {
  beforeEach(() => {
    getInventorySummaryReportMock.mockReset();
  });

  it('renders inventory summary cards and item rows from the reporting response', async () => {
    getInventorySummaryReportMock.mockResolvedValue({
      summary: {
        totalTrackedItems: 2,
        totalOnHandQuantity: 45,
        totalReceivedQuantity: 43,
        totalIssuedQuantity: 15,
        totalAdjustmentQuantity: -3,
        totalReturnedQuantity: 2,
        totalPurchaseOrderedQuantity: 53,
        totalPurchaseReceivedQuantity: 43,
        totalPurchaseOpenQuantity: 10,
      },
      items: [
        {
          inventoryItemId: 901,
          itemId: 1001,
          itemName: 'Alloy Plate',
          quantityOnHand: 40,
          receivedQuantity: 35,
          issuedQuantity: 12,
          adjustmentQuantity: -3,
          returnedQuantity: 2,
          purchaseOrderedQuantity: 45,
          purchaseReceivedQuantity: 35,
          purchaseOpenQuantity: 10,
          createdAt: '2026-03-09T09:00:00.000Z',
          updatedAt: '2026-03-10T09:15:00.000Z',
        },
        {
          inventoryItemId: 902,
          itemId: 1002,
          itemName: 'Steel Bar',
          quantityOnHand: 5,
          receivedQuantity: 8,
          issuedQuantity: 3,
          adjustmentQuantity: 0,
          returnedQuantity: 0,
          purchaseOrderedQuantity: 8,
          purchaseReceivedQuantity: 8,
          purchaseOpenQuantity: 0,
          createdAt: '2026-03-10T06:00:00.000Z',
          updatedAt: '2026-03-10T10:30:00.000Z',
        },
      ],
    });

    render(<InventorySummaryPage />);

    expect(screen.getByText('Loading inventory summary...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Inventory Summary' })).toBeInTheDocument();
    });

    expect(screen.getByText('Tracked Items')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inventory #901' })).toHaveAttribute(
      'href',
      '/inventory/items/901',
    );
    expect(screen.getByRole('link', { name: 'Alloy Plate' })).toHaveAttribute('href', '/items/1001');
    expect(screen.getByText(/Recv 35 \/ Issue 12 \/ Adj -3 \/ Return 2/)).toBeInTheDocument();
    expect(screen.getByText(/Ordered 45 \/ Received 35 \/ Open 10/)).toBeInTheDocument();
  });

  it('renders an empty state when no tracked inventory items exist', async () => {
    getInventorySummaryReportMock.mockResolvedValue({
      summary: {
        totalTrackedItems: 0,
        totalOnHandQuantity: 0,
        totalReceivedQuantity: 0,
        totalIssuedQuantity: 0,
        totalAdjustmentQuantity: 0,
        totalReturnedQuantity: 0,
        totalPurchaseOrderedQuantity: 0,
        totalPurchaseReceivedQuantity: 0,
        totalPurchaseOpenQuantity: 0,
      },
      items: [],
    });

    render(<InventorySummaryPage />);

    await waitFor(() => {
      expect(screen.getByText('No inventory items found.')).toBeInTheDocument();
    });
  });

  it('renders an error state when summary loading fails', async () => {
    getInventorySummaryReportMock.mockRejectedValue(new Error('network error'));

    render(<InventorySummaryPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to load inventory summary.');
    });
  });
});
