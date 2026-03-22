import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

import { CustomerOrderWorkspace } from '../components/customer-order-workspace';
import {
  createCustomer,
  createItem,
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
  listProductGroups,
  listSalesOrderShipments,
  listSettingsEntries,
  listUnitOfMeasures,
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
  listProductGroups: vi.fn(),
  listSalesOrderShipments: vi.fn(),
  listSettingsEntries: vi.fn(),
  listUnitOfMeasures: vi.fn(),
  payShipmentInvoice: vi.fn(),
  shipShipment: vi.fn(),
  updateQuote: vi.fn(),
  updateQuoteStatus: vi.fn(),
  updateSalesOrder: vi.fn(),
  updateSalesOrderStatus: vi.fn(),
}));

const createCustomerMock = vi.mocked(createCustomer);
const createItemMock = vi.mocked(createItem);
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
const listProductGroupsMock = vi.mocked(listProductGroups);
const listSalesOrderShipmentsMock = vi.mocked(listSalesOrderShipments);
const listSettingsEntriesMock = vi.mocked(listSettingsEntries);
const listUnitOfMeasuresMock = vi.mocked(listUnitOfMeasures);
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
    createItemMock.mockReset();
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
    listProductGroupsMock.mockReset();
    listSalesOrderShipmentsMock.mockReset();
    listSettingsEntriesMock.mockReset();
    listUnitOfMeasuresMock.mockReset();
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
        status: 'interested',
        regNo: null,
        email: 'ops@mekano.test',
        phone: '+49 30 123 000',
        vatNumber: 'DE123456789',
        contactStarted: null,
        nextContact: null,
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

    listProductGroupsMock.mockResolvedValue([]);

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

    const shippingMethodSelect = screen.getByLabelText('Shipping Method') as HTMLSelectElement;
    const shippingMethodOptions = Array.from(shippingMethodSelect.options).map(
      (option) => option.text,
    );

    expect(shippingMethodOptions).toContain('Bike courier');
    expect(shippingMethodOptions).not.toContain('Courier');
    expect(shippingMethodOptions).not.toContain('Freight');

    const statusSelect = screen.getByLabelText('Status') as HTMLSelectElement;
    expect(statusSelect).toBeInTheDocument();
    const statusOptions = Array.from(statusSelect.options).map((option) => ({
      value: option.value,
      text: option.text,
    }));
    expect(statusOptions).toContainEqual({ value: 'draft', text: 'Quotation' });
    expect(statusOptions).toContainEqual({ value: 'sent', text: 'Waiting for confirmation' });
    expect(statusOptions).toContainEqual({ value: 'approved', text: 'Confirmed' });
    expect(statusOptions).toHaveLength(3);

    // Ticket 4: salesperson/contact/reference fields removed from header
    expect(screen.queryByLabelText('Salesperson')).not.toBeInTheDocument();
  });

  it('selects the newly created customer in the form after saving from the inline Create Customer dialog', async () => {
    const existingCustomer = {
      id: 1,
      code: 'CUS-0001',
      name: 'Existing Customer',
      status: 'interested',
      regNo: null,
      email: null,
      phone: null,
      vatNumber: null,
      contactStarted: null,
      nextContact: null,
      website: null,
      billingAddress: { street: null, city: null, postcode: null, stateRegion: null, country: null },
      shippingAddress: { street: null, city: null, postcode: null, stateRegion: null, country: null },
      defaultPaymentTerm: null,
      defaultShippingTerm: null,
      defaultShippingMethod: null,
      defaultDocumentDiscountPercent: 0,
      defaultTaxRate: 19,
      internalNotes: null,
      isActive: true,
      contacts: [],
      documents: [],
      createdAt: '2026-03-12T08:00:00.000Z',
      updatedAt: '2026-03-12T08:00:00.000Z',
    };
    const newCustomer = {
      id: 2,
      code: 'CUS-0002',
      name: 'New Co',
      status: 'permanent_buyer',
      regNo: null,
      email: null,
      phone: null,
      vatNumber: null,
      contactStarted: null,
      nextContact: null,
      website: null,
      billingAddress: { street: null, city: null, postcode: null, stateRegion: null, country: null },
      shippingAddress: { street: null, city: null, postcode: null, stateRegion: null, country: null },
      defaultPaymentTerm: 'Net 30',
      defaultShippingTerm: 'DAP',
      defaultShippingMethod: 'Freight',
      defaultDocumentDiscountPercent: 5,
      defaultTaxRate: 19,
      internalNotes: null,
      isActive: true,
      contacts: [],
      documents: [],
      createdAt: '2026-03-16T10:00:00.000Z',
      updatedAt: '2026-03-16T10:00:00.000Z',
    };

    listCustomersMock.mockResolvedValue([existingCustomer]);
    listItemsMock.mockResolvedValue([]);
    listProductGroupsMock.mockResolvedValue([]);
    listAuthUsersMock.mockResolvedValue([]);
    getCurrentUserMock.mockResolvedValue({
      id: 7,
      name: 'Office User',
      email: 'office@impeasy.local',
      isActive: true,
      roles: ['office'],
      createdAt: '2026-03-12T08:00:00.000Z',
      updatedAt: '2026-03-12T08:00:00.000Z',
    });
    listSettingsEntriesMock.mockResolvedValue([]);
    createCustomerMock.mockResolvedValue(newCustomer);

    render(<CustomerOrderWorkspace workspaceId="new" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create a new customer order' })).toBeInTheDocument();
    });

    const customerSelect = screen.getByLabelText('Customer') as HTMLSelectElement;
    fireEvent.change(customerSelect, { target: { value: '__add_new__' } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create Customer' })).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'New Co' } });
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createCustomerMock).toHaveBeenCalled();
    });

    // Ticket 2: customer code is not sent when creating from popup (server assigns code)
    const createPayload = createCustomerMock.mock.calls[0][0];
    expect(createPayload).not.toHaveProperty('code');

    await waitFor(() => {
      const customerSelectAfter = screen.getByLabelText('Customer') as HTMLSelectElement;
      expect(customerSelectAfter.value).toBe(String(newCustomer.id));
    });
  });

  it('opens Create Product dialog when selecting Add new product in order lines and applies new item on save', async () => {
    listCustomersMock.mockResolvedValue([
      {
        id: 1,
        code: 'CUS-0001',
        name: 'Test Customer',
        status: 'interested',
        regNo: null,
        email: null,
        phone: null,
        vatNumber: null,
        contactStarted: null,
        nextContact: null,
        website: null,
        billingAddress: { street: '', city: '', postcode: '', stateRegion: '', country: '' },
        shippingAddress: { street: '', city: '', postcode: '', stateRegion: '', country: '' },
        defaultPaymentTerm: null,
        defaultShippingTerm: null,
        defaultShippingMethod: null,
        defaultDocumentDiscountPercent: 0,
        defaultTaxRate: 0,
        internalNotes: null,
        isActive: true,
        contacts: [],
        documents: [],
        createdAt: '2026-03-12T08:00:00.000Z',
        updatedAt: '2026-03-12T08:00:00.000Z',
      },
    ]);
    listProductGroupsMock.mockResolvedValue([]);
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
    listUnitOfMeasuresMock.mockResolvedValue([
      { id: 1, name: 'pcs', baseUnit: null, conversionRate: 1, createdAt: '', updatedAt: '' },
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
    listSettingsEntriesMock.mockResolvedValue([]);

    const newItem = {
      id: 99,
      code: 'NEW-99',
      name: 'New Widget',
      description: 'New product',
      isActive: true,
      itemGroup: null,
      unitOfMeasure: 'pcs',
      itemType: 'procured',
      defaultBomId: null,
      defaultBomName: null,
      defaultRoutingId: null,
      defaultRoutingName: null,
      defaultPrice: 10,
      reorderPoint: 0,
      safetyStock: 0,
      preferredVendorId: null,
      preferredVendorName: null,
      notes: null,
      createdAt: '2026-03-12T08:00:00.000Z',
      updatedAt: '2026-03-12T08:00:00.000Z',
    };
    createItemMock.mockResolvedValue(newItem);

    render(<CustomerOrderWorkspace workspaceId="new" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create a new customer order' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lines' }));

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Add new product' })).toBeInTheDocument();
    });

    const productSelect = screen.getAllByRole('combobox').find((el) => {
      const options = Array.from((el as HTMLSelectElement).options).map((o) => o.textContent?.trim());
      return options.some((t) => t === 'Add new product');
    });
    expect(productSelect).toBeDefined();
    fireEvent.change(productSelect!, { target: { value: '__add_new__' } });

    await waitFor(() => {
      expect(screen.getByTestId('create-product-dialog')).toBeInTheDocument();
      expect(screen.getByText('Create Product')).toBeInTheDocument();
    });

    const createProductHeading = screen.getByText('Create Product');
    const dialog = createProductHeading.closest('[role="dialog"]') ?? createProductHeading.parentElement ?? document.body;
    const partDescInput = within(dialog as HTMLElement).getByRole('textbox', { name: /Part Desc/i });
    fireEvent.change(partDescInput, { target: { value: 'New Widget' } });
    fireEvent.click(within(dialog as HTMLElement).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createItemMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByText('Create Product')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/New Widget/)).toBeInTheDocument();
    });
  });

  it('auto-selects newly created product even when API returns null itemGroup for grouped lines', async () => {
    listCustomersMock.mockResolvedValue([
      {
        id: 1,
        code: 'CUS-0001',
        name: 'Test Customer',
        status: 'interested',
        regNo: null,
        email: null,
        phone: null,
        vatNumber: null,
        contactStarted: null,
        nextContact: null,
        website: null,
        billingAddress: { street: '', city: '', postcode: '', stateRegion: '', country: '' },
        shippingAddress: { street: '', city: '', postcode: '', stateRegion: '', country: '' },
        defaultPaymentTerm: null,
        defaultShippingTerm: null,
        defaultShippingMethod: null,
        defaultDocumentDiscountPercent: 0,
        defaultTaxRate: 0,
        internalNotes: null,
        isActive: true,
        contacts: [],
        documents: [],
        createdAt: '2026-03-12T08:00:00.000Z',
        updatedAt: '2026-03-12T08:00:00.000Z',
      },
    ]);

    listProductGroupsMock.mockResolvedValue([
      { id: 1, code: 'PG-001', name: 'Group A', createdAt: '', updatedAt: '' },
    ]);

    listItemsMock.mockResolvedValue([
      {
        id: 11,
        code: 'FG-0011',
        name: 'Servo Bracket',
        description: 'Finished assembly',
        isActive: true,
        itemGroup: 'Group A',
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

    listUnitOfMeasuresMock.mockResolvedValue([
      { id: 1, name: 'pcs', baseUnit: null, conversionRate: 1, createdAt: '', updatedAt: '' },
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
    listSettingsEntriesMock.mockResolvedValue([]);

    const newItem = {
      id: 99,
      code: 'NEW-99',
      name: 'New Widget Grouped',
      description: 'New product',
      isActive: true,
      itemGroup: null, // simulate API returning null even though we created from a grouped line
      unitOfMeasure: 'pcs',
      itemType: 'procured',
      defaultBomId: null,
      defaultBomName: null,
      defaultRoutingId: null,
      defaultRoutingName: null,
      defaultPrice: 10,
      reorderPoint: 0,
      safetyStock: 0,
      preferredVendorId: null,
      preferredVendorName: null,
      notes: null,
      createdAt: '2026-03-12T08:00:00.000Z',
      updatedAt: '2026-03-12T08:00:00.000Z',
    };
    createItemMock.mockResolvedValue(newItem);

    render(<CustomerOrderWorkspace workspaceId="new" />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Create a new customer order' }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lines' }));

    // set product group to activate filtered dropdown state
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Add new product group' })).toBeInTheDocument();
    });

    const groupSelect = screen.getAllByRole('combobox').find((el) => {
      if (!(el instanceof HTMLSelectElement)) return false;
      const options = Array.from(el.options).map((o) => o.textContent?.trim());
      return options.some((t) => t === 'Select product group') && options.some((t) => t === 'Add new product group');
    });
    expect(groupSelect).toBeDefined();
    fireEvent.change(groupSelect!, { target: { value: 'Group A' } });

    const productSelect = screen.getAllByRole('combobox').find((el) => {
      const options = Array.from((el as HTMLSelectElement).options).map((o) => o.textContent?.trim());
      return options.some((t) => t === 'Add new product');
    });
    expect(productSelect).toBeDefined();
    fireEvent.change(productSelect!, { target: { value: '__add_new__' } });

    await waitFor(() => {
      expect(screen.getByTestId('create-product-dialog')).toBeInTheDocument();
      expect(screen.getByText('Create Product')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: /Part Desc/i }), {
      target: { value: 'New Widget Grouped' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createItemMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByText('Create Product')).not.toBeInTheDocument();
    });

    // Newly created product should still be visible/selected in the filtered dropdown
    await waitFor(() => {
      expect(screen.getByText(/New Widget Grouped/)).toBeInTheDocument();
    });
  });
});
