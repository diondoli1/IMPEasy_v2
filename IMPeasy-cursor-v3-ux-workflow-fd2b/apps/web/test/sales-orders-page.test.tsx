import React from 'react';
import { vi } from 'vitest';

import SalesOrdersPage from '../app/sales-orders/page';

const redirectMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

describe('SalesOrdersPage', () => {
  beforeEach(() => {
    redirectMock.mockReset();
  });

  it('redirects legacy sales-order routes into the customer-orders board', () => {
    SalesOrdersPage();
    expect(redirectMock).toHaveBeenCalledWith('/customer-orders');
  });
});
