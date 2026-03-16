import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import ManufacturingOrdersPage from '../app/manufacturing-orders/page';
import { listManufacturingOrders, listManufacturingOrdersBySalesOrder } from '../lib/api';

vi.mock('../lib/api', () => ({
  listManufacturingOrders: vi.fn(),
  listManufacturingOrdersBySalesOrder: vi.fn(),
}));

const listManufacturingOrdersMock = vi.mocked(listManufacturingOrders);
const listManufacturingOrdersBySalesOrderMock = vi.mocked(listManufacturingOrdersBySalesOrder);

const mockOrder = {
  id: 1,
  documentNumber: 'MO-00001',
  salesOrderId: 1,
  salesOrderNumber: 'SO-00001',
  salesOrderLineId: 10,
  itemId: 5,
  itemCode: 'PART-001',
  itemName: 'Widget A',
  customerId: 2,
  customerName: 'Acme',
  bomId: 1,
  bomName: 'BOM A',
  routingId: 1,
  routingName: 'Routing A',
  quantity: 10,
  dueDate: '2026-03-20T00:00:00.000Z',
  status: 'planned',
  releaseState: 'released',
  currentOperationId: 1,
  currentOperationName: 'Op 1',
  currentWorkstation: null,
  assignedOperatorId: null,
  assignedOperatorName: null,
  assignedWorkstation: null,
  bookingCompletenessPercent: 0,
};

function createSearchParams(overrides: { get: (name: string) => string | null }) {
  return overrides;
}

const useRouterMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => useRouterMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

describe('ManufacturingOrdersPage', () => {
  beforeEach(() => {
    listManufacturingOrdersMock.mockReset();
    listManufacturingOrdersBySalesOrderMock.mockReset();
    useSearchParamsMock.mockReturnValue(createSearchParams({ get: () => null }));
  });

  it('loads all manufacturing orders when salesOrderId is absent', async () => {
    listManufacturingOrdersMock.mockResolvedValue([mockOrder]);

    render(<ManufacturingOrdersPage />);

    await waitFor(() => {
      expect(listManufacturingOrdersMock).toHaveBeenCalledTimes(1);
    });

    expect(listManufacturingOrdersBySalesOrderMock).not.toHaveBeenCalled();
    expect(screen.getByText('MO-00001')).toBeInTheDocument();
    expect(screen.queryByText('Showing manufacturing orders for this sales order.')).not.toBeInTheDocument();
  });

  it('loads only manufacturing orders for sales order when salesOrderId=1', async () => {
    useSearchParamsMock.mockReturnValue(createSearchParams({ get: (name) => (name === 'salesOrderId' ? '1' : null) }));
    listManufacturingOrdersBySalesOrderMock.mockResolvedValue([mockOrder]);

    render(<ManufacturingOrdersPage />);

    await waitFor(() => {
      expect(listManufacturingOrdersBySalesOrderMock).toHaveBeenCalledWith(1);
    });

    expect(listManufacturingOrdersMock).not.toHaveBeenCalled();
    expect(screen.getByText('MO-00001')).toBeInTheDocument();
    expect(screen.getByText('Showing manufacturing orders for this sales order.')).toBeInTheDocument();
  });
});
