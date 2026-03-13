import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import ProductionPage from '../app/production/page';
import { getProductionPerformanceDashboard } from '../lib/api';

vi.mock('../lib/api', () => ({
  getProductionPerformanceDashboard: vi.fn(),
}));

const getProductionPerformanceDashboardMock = vi.mocked(getProductionPerformanceDashboard);

describe('ProductionPage', () => {
  beforeEach(() => {
    getProductionPerformanceDashboardMock.mockReset();
  });

  it('renders production summary cards and work-order rows from the reporting response', async () => {
    getProductionPerformanceDashboardMock.mockResolvedValue({
      summary: {
        totalWorkOrders: 2,
        plannedWorkOrders: 0,
        releasedWorkOrders: 0,
        inProgressWorkOrders: 1,
        completedWorkOrders: 1,
        closedWorkOrders: 0,
        totalOperations: 6,
        queuedOperations: 1,
        readyOperations: 1,
        runningOperations: 1,
        pausedOperations: 0,
        completedOperations: 3,
        pendingInspections: 1,
        passedInspections: 1,
        failedInspections: 0,
        reworkRequiredInspections: 0,
        totalPlannedQuantity: 28,
        totalRecordedQuantity: 20,
        totalScrappedQuantity: 0,
      },
      workOrders: [
        {
          workOrderId: 701,
          salesOrderId: 41,
          salesOrderLineId: 301,
          itemId: 1001,
          itemName: 'Gear Housing',
          customerId: 10,
          customerName: 'Alpha Dynamics',
          workOrderStatus: 'in_progress',
          plannedQuantity: 20,
          operationCount: 3,
          queuedOperationCount: 1,
          readyOperationCount: 0,
          runningOperationCount: 1,
          pausedOperationCount: 0,
          completedOperationCount: 1,
          pendingInspectionCount: 1,
          passedInspectionCount: 0,
          failedInspectionCount: 0,
          reworkRequiredInspectionCount: 0,
          recordedProductionQuantity: 17,
          qualityPassedQuantity: 0,
          qualityFailedQuantity: 0,
          qualityReworkQuantity: 0,
          scrappedQuantity: 0,
          createdAt: '2026-03-10T05:00:00.000Z',
          updatedAt: '2026-03-10T07:00:00.000Z',
        },
        {
          workOrderId: 702,
          salesOrderId: 42,
          salesOrderLineId: 302,
          itemId: 1002,
          itemName: 'Valve Stem',
          customerId: 11,
          customerName: 'Bravo Fabrication',
          workOrderStatus: 'completed',
          plannedQuantity: 8,
          operationCount: 3,
          queuedOperationCount: 0,
          readyOperationCount: 1,
          runningOperationCount: 0,
          pausedOperationCount: 0,
          completedOperationCount: 2,
          pendingInspectionCount: 0,
          passedInspectionCount: 1,
          failedInspectionCount: 0,
          reworkRequiredInspectionCount: 0,
          recordedProductionQuantity: 3,
          qualityPassedQuantity: 3,
          qualityFailedQuantity: 0,
          qualityReworkQuantity: 0,
          scrappedQuantity: 0,
          createdAt: '2026-03-10T03:00:00.000Z',
          updatedAt: '2026-03-10T06:00:00.000Z',
        },
      ],
    });

    render(<ProductionPage />);

    expect(screen.getByText('Loading production dashboard...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Production Performance' })).toBeInTheDocument();
    });

    expect(screen.getByText('Total Work Orders')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Work order #701' })).toHaveAttribute(
      'href',
      '/work-orders/701',
    );
    expect(screen.getByRole('link', { name: 'Sales order #41' })).toHaveAttribute(
      'href',
      '/sales-orders/41',
    );
    expect(screen.getByText('Alpha Dynamics')).toBeInTheDocument();
    expect(screen.getByText('Gear Housing')).toBeInTheDocument();
    expect(screen.getByText(/Q 1 \/ R 0 \/ Run 1 \/ P 0 \/ Done 1/)).toBeInTheDocument();
    expect(
      screen.getByText(/Pending 1 \/ Passed 0 \/ Failed 0 \/ Rework 0/),
    ).toBeInTheDocument();
  });

  it('renders an empty state when no work orders exist', async () => {
    getProductionPerformanceDashboardMock.mockResolvedValue({
      summary: {
        totalWorkOrders: 0,
        plannedWorkOrders: 0,
        releasedWorkOrders: 0,
        inProgressWorkOrders: 0,
        completedWorkOrders: 0,
        closedWorkOrders: 0,
        totalOperations: 0,
        queuedOperations: 0,
        readyOperations: 0,
        runningOperations: 0,
        pausedOperations: 0,
        completedOperations: 0,
        pendingInspections: 0,
        passedInspections: 0,
        failedInspections: 0,
        reworkRequiredInspections: 0,
        totalPlannedQuantity: 0,
        totalRecordedQuantity: 0,
        totalScrappedQuantity: 0,
      },
      workOrders: [],
    });

    render(<ProductionPage />);

    await waitFor(() => {
      expect(screen.getByText('No work orders found.')).toBeInTheDocument();
    });
  });

  it('renders an error state when dashboard loading fails', async () => {
    getProductionPerformanceDashboardMock.mockRejectedValue(new Error('network error'));

    render(<ProductionPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to load production dashboard.');
    });
  });
});
