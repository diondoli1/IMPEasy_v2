import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ItemRoutingLinks } from '../components/item-routing-links';

describe('ItemRoutingLinks', () => {
  it('shows empty state when no routings are linked', () => {
    render(
      <ItemRoutingLinks
        itemId={1}
        routings={[]}
        defaultRoutingId={null}
        onSetDefault={async () => {
          throw new Error('not expected');
        }}
      />,
    );

    expect(screen.getByText('No routings linked to this item.')).toBeInTheDocument();
  });

  it('sets selected routing as default', async () => {
    const assigned: number[] = [];

    render(
      <ItemRoutingLinks
        itemId={1}
        routings={[
          {
            id: 11,
            itemId: 1,
            name: 'Primary Routing',
            description: null,
            status: 'draft',
            createdAt: '2026-03-10T09:00:00.000Z',
            updatedAt: '2026-03-10T09:00:00.000Z',
          },
          {
            id: 12,
            itemId: 1,
            name: 'Alternate Routing',
            description: null,
            status: 'draft',
            createdAt: '2026-03-10T09:00:00.000Z',
            updatedAt: '2026-03-10T09:00:00.000Z',
          },
        ]}
        defaultRoutingId={11}
        onSetDefault={async (routingId) => {
          assigned.push(routingId);
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Default' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Set default' }));

    await waitFor(() => {
      expect(assigned[0]).toBe(12);
    });
  });
});
