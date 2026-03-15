import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import CustomerOrdersDashboardPage from '../app/dashboards/customer-orders/page';
import InventoryDashboardPage from '../app/dashboards/inventory/page';
import ProductionDashboardPage from '../app/dashboards/production/page';
import PurchasingDashboardPage from '../app/dashboards/purchasing/page';
import {
  getCustomerOrdersDashboard,
  getInventoryDashboard,
  getProductionDashboard,
  getPurchasingDashboard,
} from '../lib/api';

vi.mock('../lib/api', () => ({
  getCustomerOrdersDashboard: vi.fn(),
  getProductionDashboard: vi.fn(),
  getInventoryDashboard: vi.fn(),
  getPurchasingDashboard: vi.fn(),
}));

const getCustomerOrdersDashboardMock = vi.mocked(getCustomerOrdersDashboard);
const getProductionDashboardMock = vi.mocked(getProductionDashboard);
const getInventoryDashboardMock = vi.mocked(getInventoryDashboard);
const getPurchasingDashboardMock = vi.mocked(getPurchasingDashboard);

function createDashboardFixture(moduleName: string) {
  return {
    module: moduleName,
    generatedAt: '2026-03-11T12:00:00.000Z',
    cards: [
      {
        key: `${moduleName}_card`,
        label: `${moduleName} card`,
        value: 7,
        hint: 'Operational count',
        href: '/customer-orders',
      },
    ],
  };
}

describe('Module dashboard pages', () => {
  beforeEach(() => {
    getCustomerOrdersDashboardMock.mockReset();
    getProductionDashboardMock.mockReset();
    getInventoryDashboardMock.mockReset();
    getPurchasingDashboardMock.mockReset();
  });

  it('renders customer-orders dashboard cards from the reporting endpoint', async () => {
    getCustomerOrdersDashboardMock.mockResolvedValue(createDashboardFixture('customer-orders'));

    render(<CustomerOrdersDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Customer orders dashboard' })).toBeInTheDocument();
    });
    expect(screen.getByText('customer-orders card')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders production dashboard cards from the reporting endpoint', async () => {
    getProductionDashboardMock.mockResolvedValue(createDashboardFixture('production'));

    render(<ProductionDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Production dashboard' })).toBeInTheDocument();
    });
    expect(screen.getByText('production card')).toBeInTheDocument();
  });

  it('renders inventory dashboard cards from the reporting endpoint', async () => {
    getInventoryDashboardMock.mockResolvedValue(createDashboardFixture('inventory'));

    render(<InventoryDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Inventory dashboard' })).toBeInTheDocument();
    });
    expect(screen.getByText('inventory card')).toBeInTheDocument();
  });

  it('renders purchasing dashboard cards from the reporting endpoint', async () => {
    getPurchasingDashboardMock.mockResolvedValue(createDashboardFixture('purchasing'));

    render(<PurchasingDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Purchasing dashboard' })).toBeInTheDocument();
    });
    expect(screen.getByText('purchasing card')).toBeInTheDocument();
  });
});
