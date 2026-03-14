import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { CustomerOrderWorkspace } from '../components/customer-order-workspace';
import {
  createCustomer,
  createQuote,
  createShipment,
  createShipmentInvoice,
  convertQuote,
  deleteQuote,
  deliverShipment,
  getCurrentUser,
  getQuote,
  getSalesOrder,
  getSalesOrderAuditTrail,
  getSalesOrderShippingAvailability,
  getShipmentInvoice,
  listAuthUsers,
  listCustomers,
  listItems,
  listSalesOrderShipments,
  listSettingsEntries,
  packShipment,
  payShipmentInvoice,
  shipShipment,
  updateQuote,
  updateQuoteStatus,
  updateSalesOrder,
  updateSalesOrderStatus,
} from '../lib/api';

const routerMock = {
  push: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('../lib/api', () => ({
  createCustomer: vi.fn(),
  createItem: vi.fn(),
  createQuote: vi.fn(),
  createShipment: vi.fn(),
  deleteQuote: vi.fn(),
  createShipmentInvoice: vi.fn(),
  convertQuote: vi.fn(),
  deliverShipment: vi.fn(),
  getCurrentUser: vi.fn(),
  getQuote: vi.fn(),
  getSalesOrder: vi.fn(),
  getSalesOrderAuditTrail: vi.fn(),
  getSalesOrderShippingAvailability: vi.fn(),
  getShipmentInvoice: vi.fn(),
  listAuthUsers: vi.fn(),
  listCustomers: vi.fn(),
  listItems: vi.fn(),
  listSalesOrderShipments: vi.fn(),
  listSettingsEntries: vi.fn(),
  packShipment: vi.fn(),
  payShipmentInvoice: vi.fn(),
  shipShipment: vi.fn(),
  updateQuote: vi.fn(),
  updateQuoteStatus: vi.fn(),
  updateSalesOrder: vi.fn(),
  updateSalesOrderStatus: vi.fn(),
}));

const createQuoteMock = vi.mocked(createQuote);
const createShipmentMock = vi.mocked(createShipment);
const createShipmentInvoiceMock = vi.mocked(createShipmentInvoice);
const convertQuoteMock = vi.mocked(convertQuote);
const deliverShipmentMock = vi.mocked(deliverShipment);
const getCurrentUserMock = vi.mocked(getCurrentUser);
const getQuoteMock = vi.mocked(getQuote);
const getSalesOrderMock = vi.mocked(getSalesOrder);
const getSalesOrderAuditTrailMock = vi.mocked(getSalesOrderAuditTrail);
const getSalesOrderShippingAvailabilityMock = vi.mocked(getSalesOrderShippingAvailability);
const getShipmentInvoiceMock = vi.mocked(getShipmentInvoice);
const listAuthUsersMock = vi.mocked(listAuthUsers);
const listCustomersMock = vi.mocked(listCustomers);
const listItemsMock = vi.mocked(listItems);
const listSalesOrderShipmentsMock = vi.mocked(listSalesOrderShipments);
const listSettingsEntriesMock = vi.mocked(listSettingsEntries);
const packShipmentMock = vi.mocked(packShipment);
const payShipmentInvoiceMock = vi.mocked(payShipmentInvoice);
const shipShipmentMock = vi.mocked(shipShipment);
const updateQuoteMock = vi.mocked(updateQuote);
const updateQuoteStatusMock = vi.mocked(updateQuoteStatus);
const updateSalesOrderMock = vi.mocked(updateSalesOrder);
const updateSalesOrderStatusMock = vi.mocked(updateSalesOrderStatus);

describe('CustomerOrderWorkspace', () => {
  beforeEach(() => {
    routerMock.push.mockReset();
    vi.mocked(createCustomer).mockReset();
    createQuoteMock.mockReset();
    vi.mocked(deleteQuote).mockReset();
    createShipmentMock.mockReset();
    createShipmentInvoiceMock.mockReset();
    convertQuoteMock.mockReset();
    deliverShipmentMock.mockReset();
    getCurrentUserMock.mockReset();
    getQuoteMock.mockReset();
    getSalesOrderMock.mockReset();
    getSalesOrderAuditTrailMock.mockReset();
    getSalesOrderShippingAvailabilityMock.mockReset();
    getShipmentInvoiceMock.mockReset();
    listAuthUsersMock.mockReset();
    listCustomersMock.mockReset();
    listItemsMock.mockReset();
    listSalesOrderShipmentsMock.mockReset();
    listSettingsEntriesMock.mockReset();
    packShipmentMock.mockReset();
    payShipmentInvoiceMock.mockReset();
    shipShipmentMock.mockReset();
    updateQuoteMock.mockReset();
    updateQuoteStatusMock.mockReset();
    updateSalesOrderMock.mockReset();
    updateSalesOrderStatusMock.mockReset();
  });

  it('keeps office workspace usable without /auth/users and uses settings-driven shipping methods', async () => {
    listCustomersMock.mockResolvedValue([
      {
        id: 1,
        code: 'CUS-0001',
        name: 'Mekano Werkzeugbau',
        email: 'ops@mekano.test',
        phone: '+49 30 123 000',
        vatNumber: 'DE123456789',
        website: 'mekano.test',
        billingAddress: {
          street: 'Billing 1',
          city: 'Berlin',
          postcode: '10115',
          stateRegion: 'Berlin',
          country: 'DE',
        },
        shippingAddress: {
          street: 'Shipping 2',
          city: 'Berlin',
          postcode: '10117',
          stateRegion: 'Berlin',
          country: 'DE',
        },
        defaultPaymentTerm: 'Net 45 days',
        defaultShippingTerm: 'Delivered at place',
        defaultShippingMethod: 'Bike courier',
        defaultDocumentDiscountPercent: 0,
        defaultTaxRate: 19,
        internalNotes: null,
        isActive: true,
        contacts: [],
        documents: [],
        createdAt: '2026-03-12T08:00:00.000Z',
        updatedAt: '2026-03-12T08:00:00.000Z',
      },
    ]);

    listItemsMock.mockResolvedValue([
      {
        id: 11,
        code: 'FG-0011',
        name: 'Servo Bracket',
        description: 'Finished assembly',
        isActive: true,
        itemGroup: null,
        unitOfMeasure: 'pcs',
        itemType: 'produced',
        defaultBomId: null,
        defaultBomName: null,
        defaultRoutingId: null,
        defaultRoutingName: null,
        defaultPrice: 120,
        reorderPoint: 0,
        safetyStock: 0,
        preferredVendorId: null,
        preferredVendorName: null,
        notes: null,
        createdAt: '2026-03-12T08:00:00.000Z',
        updatedAt: '2026-03-12T08:00:00.000Z',
      },
    ]);

    listAuthUsersMock.mockRejectedValue(new Error('Forbidden'));
    getCurrentUserMock.mockResolvedValue({
      id: 7,
      name: 'Office User',
      email: 'office@impeasy.local',
      isActive: true,
      roles: ['office'],
      createdAt: '2026-03-12T08:00:00.000Z',
      updatedAt: '2026-03-12T08:00:00.000Z',
    });

    listSettingsEntriesMock.mockImplementation(async (listType) => {
      switch (listType) {
        case 'payment_terms':
          return [
            {
              id: 1,
              listType,
              code: 'NET45',
              label: 'Net 45 days',
              numericValue: null,
              isActive: true,
              sortOrder: 10,
              createdAt: '2026-03-12T08:00:00.000Z',
              updatedAt: '2026-03-12T08:00:00.000Z',
            },
          ];
        case 'shipping_terms':
          return [
            {
              id: 2,
              listType,
              code: 'DAP',
              label: 'Delivered at place',
              numericValue: null,
              isActive: true,
              sortOrder: 10,
              createdAt: '2026-03-12T08:00:00.000Z',
              updatedAt: '2026-03-12T08:00:00.000Z',
            },
          ];
        case 'shipping_methods':
          return [
            {
              id: 3,
              listType,
              code: 'BIKE',
              label: 'Bike courier',
              numericValue: null,
              isActive: true,
              sortOrder: 10,
              createdAt: '2026-03-12T08:00:00.000Z',
              updatedAt: '2026-03-12T08:00:00.000Z',
            },
            {
              id: 4,
              listType,
              code: 'FREIGHT',
              label: 'Freight',
              numericValue: null,
              isActive: false,
              sortOrder: 20,
              createdAt: '2026-03-12T08:00:00.000Z',
              updatedAt: '2026-03-12T08:00:00.000Z',
            },
          ];
        case 'tax_rates':
          return [
            {
              id: 5,
              listType,
              code: 'DE-19',
              label: 'Germany standard',
              numericValue: 19,
              isActive: true,
              sortOrder: 10,
              createdAt: '2026-03-12T08:00:00.000Z',
              updatedAt: '2026-03-12T08:00:00.000Z',
            },
          ];
        default:
          return [];
      }
    });

    render(<CustomerOrderWorkspace workspaceId="new" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create a new customer order' })).toBeInTheDocument();
    });

    expect(
      screen.queryByText('Unable to load the customer-order workspace.'),
    ).not.toBeInTheDocument();

    const salespersonSelect = screen.getByLabelText('Salesperson') as HTMLSelectElement;
    const salespersonOptions = Array.from(salespersonSelect.options).map((option) => option.text);
    expect(salespersonOptions).toContain('Office User');

    const shippingMethodSelect = screen.getByLabelText('Shipping Method') as HTMLSelectElement;
    const shippingMethodOptions = Array.from(shippingMethodSelect.options).map(
      (option) => option.text,
    );

    expect(shippingMethodOptions).toContain('Bike courier');
    expect(shippingMethodOptions).not.toContain('Courier');
    expect(shippingMethodOptions).not.toContain('Freight');
  });
});
