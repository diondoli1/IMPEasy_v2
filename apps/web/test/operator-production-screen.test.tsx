import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { OperatorProductionScreen } from '../components/operator-production-screen';

const baseOperation = {
  id: 5,
  workOrderId: 2,
  salesOrderId: 1,
  salesOrderLineId: 7,
  itemId: 11,
  routingId: 3,
  routingOperationId: 4,
  operationName: 'Laser Cutting',
  sequence: 10,
  plannedQuantity: 50,
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-03-10T10:00:00.000Z',
};

describe('OperatorProductionScreen', () => {
  it('renders operation production context and start action for ready operations', () => {
    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'ready' }}
        productionLogs={[]}
        onStart={async () => {}}
        onPause={async () => {}}
        onComplete={async () => {}}
        onCreateProductionLog={async () => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Operator Screen - Operation #5' })).toBeInTheDocument();
    expect(screen.getByText('Laser Cutting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start operation' })).toBeInTheDocument();
    expect(screen.getByText('No production logs recorded.')).toBeInTheDocument();
  });

  it('shows source operation traceability for rework operations', () => {
    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'ready', reworkSourceOperationId: 4 }}
        productionLogs={[]}
        onStart={async () => {}}
        onPause={async () => {}}
        onComplete={async () => {}}
        onCreateProductionLog={async () => {}}
      />,
    );

    expect(screen.getByText('Rework Source Operation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '#4' })).toHaveAttribute('href', '/operations/4');
  });

  it('submits operation start action', async () => {
    const starts: number[] = [];

    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'ready' }}
        productionLogs={[]}
        onStart={async () => {
          starts.push(5);
        }}
        onPause={async () => {}}
        onComplete={async () => {}}
        onCreateProductionLog={async () => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start operation' }));

    await waitFor(() => {
      expect(starts).toEqual([5]);
    });
  });

  it('renders running actions and submits pause and complete actions', async () => {
    const pauses: number[] = [];
    const completions: number[] = [];

    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'running' }}
        productionLogs={[]}
        onStart={async () => {}}
        onPause={async () => {
          pauses.push(5);
        }}
        onComplete={async () => {
          completions.push(5);
        }}
        onCreateProductionLog={async () => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Pause operation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete operation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record production' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pause operation' }));
    await waitFor(() => {
      expect(pauses).toEqual([5]);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Complete operation' }));
    await waitFor(() => {
      expect(completions).toEqual([5]);
    });
  });

  it('submits production log action', async () => {
    const createdLogs: Array<{ quantity: number; notes?: string }> = [];

    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'running' }}
        productionLogs={[]}
        onStart={async () => {}}
        onPause={async () => {}}
        onComplete={async () => {}}
        onCreateProductionLog={async (input) => {
          createdLogs.push(input);
        }}
      />,
    );

    const quantityInput = screen.getByLabelText('Quantity') as HTMLInputElement;
    fireEvent.change(quantityInput, { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'First pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record production' }));

    await waitFor(() => {
      expect(createdLogs).toEqual([{ quantity: 3, notes: 'First pass' }]);
    });
    expect(screen.getByText('Production log recorded.')).toBeInTheDocument();
  });

  it('shows validation error when production quantity is invalid', async () => {
    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'running' }}
        productionLogs={[]}
        onStart={async () => {}}
        onPause={async () => {}}
        onComplete={async () => {}}
        onCreateProductionLog={async () => {}}
      />,
    );

    const quantityInput = screen.getByLabelText('Quantity') as HTMLInputElement;
    fireEvent.change(quantityInput, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record production' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Quantity must be greater than zero.');
    });
  });

  it('renders existing production logs', () => {
    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'paused' }}
        productionLogs={[
          {
            id: 1,
            operationId: 5,
            quantity: 3,
            notes: 'First pass',
            createdAt: '2026-03-10T10:00:00.000Z',
            updatedAt: '2026-03-10T10:00:00.000Z',
          },
        ]}
        onStart={async () => {}}
        onPause={async () => {}}
        onComplete={async () => {}}
        onCreateProductionLog={async () => {}}
      />,
    );

    expect(screen.getByText('Production logs can be recorded only while operation is running.')).toBeInTheDocument();
    expect(screen.getByText('First pass')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows error when operation start fails', async () => {
    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'ready' }}
        productionLogs={[]}
        onStart={async () => {
          throw new Error('failed');
        }}
        onPause={async () => {}}
        onComplete={async () => {}}
        onCreateProductionLog={async () => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start operation' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to start operation.');
    });
  });

  it('shows error when operation pause fails', async () => {
    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'running' }}
        productionLogs={[]}
        onStart={async () => {}}
        onPause={async () => {
          throw new Error('failed');
        }}
        onComplete={async () => {}}
        onCreateProductionLog={async () => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pause operation' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to pause operation.');
    });
  });

  it('shows error when operation complete fails', async () => {
    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'running' }}
        productionLogs={[]}
        onStart={async () => {}}
        onPause={async () => {}}
        onComplete={async () => {
          throw new Error('failed');
        }}
        onCreateProductionLog={async () => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Complete operation' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to complete operation.');
    });
  });

  it('shows error when production log creation fails', async () => {
    render(
      <OperatorProductionScreen
        operation={{ ...baseOperation, status: 'running' }}
        productionLogs={[]}
        onStart={async () => {}}
        onPause={async () => {}}
        onComplete={async () => {}}
        onCreateProductionLog={async () => {
          throw new Error('failed');
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Record production' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to record production log.');
    });
  });
});
