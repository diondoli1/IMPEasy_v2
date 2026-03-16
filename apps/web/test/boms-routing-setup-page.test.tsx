import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import SetupBomRoutingPage from '../app/boms-routing/new/page';
import {
  createBom,
  createBomItem,
  createRouting,
  createRoutingOperation,
  getItem,
  listBomItems,
  listBomsByItem,
  listItems,
  listRoutingOperations,
  listRoutingsByItem,
  listWorkstationGroups,
  setBomAsDefault,
  setRoutingAsDefault,
  updateBomItem,
  updateRoutingOperation,
} from '../lib/api';

vi.mock('../lib/api', () => ({
  createBom: vi.fn(),
  createBomItem: vi.fn(),
  createRouting: vi.fn(),
  createRoutingOperation: vi.fn(),
  getItem: vi.fn(),
  listBomItems: vi.fn(),
  listBomsByItem: vi.fn(),
  listItems: vi.fn(),
  listRoutingOperations: vi.fn(),
  listRoutingsByItem: vi.fn(),
  listWorkstationGroups: vi.fn(),
  setBomAsDefault: vi.fn(),
  setRoutingAsDefault: vi.fn(),
  updateBomItem: vi.fn(),
  updateRoutingOperation: vi.fn(),
}));

const getItemMock = vi.mocked(getItem);
const listBomsByItemMock = vi.mocked(listBomsByItem);
const listRoutingsByItemMock = vi.mocked(listRoutingsByItem);
const listBomItemsMock = vi.mocked(listBomItems);
const listRoutingOperationsMock = vi.mocked(listRoutingOperations);
const listItemsMock = vi.mocked(listItems);
const listWorkstationGroupsMock = vi.mocked(listWorkstationGroups);
const createBomMock = vi.mocked(createBom);
const createRoutingMock = vi.mocked(createRouting);

const useRouterMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => useRouterMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

function createSearchParams(overrides: { get: (name: string) => string | null }) {
  return overrides;
}

const mockItem = {
  id: 42,
  code: 'WIDGET-01',
  name: 'Test Widget',
  description: null,
  isActive: true,
  itemGroup: 'Widgets',
  unitOfMeasure: 'pcs',
  itemType: 'produced',
  defaultBomId: null,
  defaultRoutingId: null,
  defaultPrice: 10,
  reorderPoint: 0,
  safetyStock: 0,
  preferredVendorId: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
};

const mockBom = {
  id: 1,
  itemId: 42,
  itemCode: 'WIDGET-01',
  itemName: 'Test Widget',
  code: 'BOM-0001',
  name: 'WIDGET-01 | BOM',
  description: null,
  status: 'draft',
  notes: null,
  roughCost: 0,
  createdAt: '',
  updatedAt: '',
};

const mockRouting = {
  id: 1,
  itemId: 42,
  itemCode: 'WIDGET-01',
  itemName: 'Test Widget',
  code: 'ROUT-0001',
  name: 'WIDGET-01 | Routing',
  description: null,
  status: 'draft',
  createdAt: '',
  updatedAt: '',
};

describe('SetupBomRoutingPage', () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({ push: vi.fn() });
    useSearchParamsMock.mockReturnValue(
      createSearchParams({ get: (name) => (name === 'itemId' ? '42' : null) }),
    );
    getItemMock.mockResolvedValue(mockItem);
    listBomsByItemMock.mockResolvedValue([mockBom]);
    listRoutingsByItemMock.mockResolvedValue([mockRouting]);
    listBomItemsMock.mockResolvedValue([]);
    listRoutingOperationsMock.mockResolvedValue([]);
    listItemsMock.mockResolvedValue([]);
    listWorkstationGroupsMock.mockResolvedValue([]);
  });

  it('renders setup page with BOM and Routing tabs when itemId is provided', async () => {
    render(<SetupBomRoutingPage />);

    await waitFor(() => {
      expect(getItemMock).toHaveBeenCalledWith(42);
    });

    expect(screen.getByText(/Setup BOM & Routing/i)).toBeInTheDocument();
    expect(screen.getByText(/WIDGET-01 – Test Widget/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'BOM' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Routing' })).toBeInTheDocument();
    expect(screen.getByText('BOM lines')).toBeInTheDocument();
  });

  it('shows invalid item message when itemId is missing', async () => {
    useSearchParamsMock.mockReturnValue(createSearchParams({ get: () => null }));

    render(<SetupBomRoutingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Invalid item or missing itemId/)).toBeInTheDocument();
    });
  });
});
