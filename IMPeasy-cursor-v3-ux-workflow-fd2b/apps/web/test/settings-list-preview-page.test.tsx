import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { SettingsListPage } from '../components/settings-list-preview-page';
import {
  createSettingsEntry,
  deleteSettingsEntry,
  listSettingsEntries,
  updateSettingsEntry,
} from '../lib/api';

vi.mock('../lib/api', () => ({
  listSettingsEntries: vi.fn(),
  createSettingsEntry: vi.fn(),
  updateSettingsEntry: vi.fn(),
  deleteSettingsEntry: vi.fn(),
}));

const listSettingsEntriesMock = vi.mocked(listSettingsEntries);
const createSettingsEntryMock = vi.mocked(createSettingsEntry);
const updateSettingsEntryMock = vi.mocked(updateSettingsEntry);
const deleteSettingsEntryMock = vi.mocked(deleteSettingsEntry);

describe('SettingsListPage', () => {
  beforeEach(() => {
    listSettingsEntriesMock.mockReset();
    createSettingsEntryMock.mockReset();
    updateSettingsEntryMock.mockReset();
    deleteSettingsEntryMock.mockReset();
  });

  it('loads persisted settings entries', async () => {
    listSettingsEntriesMock.mockResolvedValue([
      {
        id: 1,
        listType: 'payment_terms',
        code: 'NET30',
        label: 'Net 30 days',
        numericValue: null,
        isActive: true,
        sortOrder: 10,
        createdAt: '2026-03-11T12:00:00.000Z',
        updatedAt: '2026-03-11T12:00:00.000Z',
      },
    ]);

    render(
      <SettingsListPage
        title="Payment terms"
        description="List of payment terms"
        listType="payment_terms"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('NET30')).toBeInTheDocument();
    });
    expect(screen.getByText('Net 30 days')).toBeInTheDocument();
  });

  it('creates a new entry from dialog input', async () => {
    listSettingsEntriesMock
      .mockResolvedValueOnce([
        {
          id: 1,
          listType: 'shipping_methods',
          code: 'PICKUP',
          label: 'Customer pickup',
          numericValue: null,
          isActive: true,
          sortOrder: 10,
          createdAt: '2026-03-11T12:00:00.000Z',
          updatedAt: '2026-03-11T12:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 1,
          listType: 'shipping_methods',
          code: 'PICKUP',
          label: 'Customer pickup',
          numericValue: null,
          isActive: true,
          sortOrder: 10,
          createdAt: '2026-03-11T12:00:00.000Z',
          updatedAt: '2026-03-11T12:00:00.000Z',
        },
        {
          id: 2,
          listType: 'shipping_methods',
          code: 'DHL-EXP',
          label: 'DHL Express',
          numericValue: null,
          isActive: true,
          sortOrder: 20,
          createdAt: '2026-03-11T12:00:00.000Z',
          updatedAt: '2026-03-11T12:00:00.000Z',
        },
      ]);

    createSettingsEntryMock.mockResolvedValue({
      id: 2,
      listType: 'shipping_methods',
      code: 'DHL-EXP',
      label: 'DHL Express',
      numericValue: null,
      isActive: true,
      sortOrder: 20,
      createdAt: '2026-03-11T12:00:00.000Z',
      updatedAt: '2026-03-11T12:00:00.000Z',
    });

    render(
      <SettingsListPage
        title="Shipping methods"
        description="List of shipping methods"
        listType="shipping_methods"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('PICKUP')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), {
      target: { value: 'DHL-EXP' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Label' }), {
      target: { value: 'DHL Express' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));

    await waitFor(() => {
      expect(createSettingsEntryMock).toHaveBeenCalledWith('shipping_methods', {
        code: 'DHL-EXP',
        label: 'DHL Express',
        numericValue: undefined,
        isActive: true,
        sortOrder: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('DHL-EXP')).toBeInTheDocument();
    });
  });
});
