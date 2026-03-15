import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { OperationInspectionPanel } from '../components/operation-inspection-panel';
import type { Inspection } from '../types/inspection';
import type { OperationDetail } from '../types/operation';

const completedOperation: OperationDetail = {
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
  status: 'completed',
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-03-10T10:00:00.000Z',
};

describe('OperationInspectionPanel', () => {
  it('shows blocked message for non-completed operations', () => {
    render(
      <OperationInspectionPanel
        operation={{ ...completedOperation, status: 'running' }}
        inspection={null}
        producedQuantity={0}
        onCreateInspection={async () => {}}
        onRecordInspectionResult={async () => {}}
        onCreateReworkOperation={async () => {}}
        onRecordInspectionScrap={async () => {}}
      />,
    );

    expect(
      screen.getByText('Inspection records can be created only for completed operations.'),
    ).toBeInTheDocument();
  });

  it('submits inspection creation for completed operations', async () => {
    const submitted: Array<{ notes?: string }> = [];

    render(
      <OperationInspectionPanel
        operation={completedOperation}
        inspection={null}
        producedQuantity={50}
        onCreateInspection={async (payload) => {
          submitted.push(payload);
        }}
        onRecordInspectionResult={async () => {}}
        onCreateReworkOperation={async () => {}}
        onRecordInspectionScrap={async () => {}}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Inspection Notes' }), {
      target: { value: 'First article inspection pending' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create inspection record' }));

    await waitFor(() => {
      expect(submitted).toEqual([{ notes: 'First article inspection pending' }]);
    });
  });

  it('shows existing inspection details', () => {
    const inspection: Inspection = {
      id: 9,
      operationId: 5,
      status: 'pending',
      notes: 'Awaiting QC',
      passedQuantity: null,
      failedQuantity: null,
      reworkQuantity: null,
      scrappedQuantity: null,
      scrapNotes: null,
      scrappedAt: null,
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
    };

    render(
      <OperationInspectionPanel
        operation={completedOperation}
        inspection={inspection}
        producedQuantity={50}
        onCreateInspection={async () => {}}
        onRecordInspectionResult={async () => {}}
        onCreateReworkOperation={async () => {}}
        onRecordInspectionScrap={async () => {}}
      />,
    );

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('Awaiting QC')).toBeInTheDocument();
    expect(
      screen.getByText('Inspection record already exists for this operation.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Produced Quantity')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('submits inspection result recording for pending inspections', async () => {
    const submitted: Array<{
      status: 'passed' | 'failed';
      passedQuantity: number;
      failedQuantity: number;
      reworkQuantity: number;
      notes?: string;
    }> = [];
    const inspection: Inspection = {
      id: 10,
      operationId: 5,
      status: 'pending',
      notes: 'Ready for review',
      passedQuantity: null,
      failedQuantity: null,
      reworkQuantity: null,
      scrappedQuantity: null,
      scrapNotes: null,
      scrappedAt: null,
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
    };

    render(
      <OperationInspectionPanel
        operation={completedOperation}
        inspection={inspection}
        producedQuantity={50}
        onCreateInspection={async () => {}}
        onRecordInspectionResult={async (payload) => {
          submitted.push(payload);
        }}
        onCreateReworkOperation={async () => {}}
        onRecordInspectionScrap={async () => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText('Result Status'), {
      target: { value: 'failed' },
    });
    fireEvent.change(screen.getByLabelText('Passed Quantity'), {
      target: { value: '35' },
    });
    fireEvent.change(screen.getByLabelText('Failed Quantity'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText('Rework Quantity'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText('Result Notes'), {
      target: { value: 'Mixed result' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record inspection result' }));

    await waitFor(() => {
      expect(submitted).toEqual([
        {
          status: 'failed',
          passedQuantity: 35,
          failedQuantity: 10,
          reworkQuantity: 5,
          notes: 'Mixed result',
        },
      ]);
    });
  });

  it('creates a rework operation for failed inspections with rework quantity', async () => {
    const inspection: Inspection = {
      id: 11,
      operationId: 5,
      status: 'failed',
      notes: 'Needs rework',
      passedQuantity: 35,
      failedQuantity: 10,
      reworkQuantity: 5,
      scrappedQuantity: null,
      scrapNotes: null,
      scrappedAt: null,
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
    };
    let invoked = false;

    render(
      <OperationInspectionPanel
        operation={completedOperation}
        inspection={inspection}
        producedQuantity={50}
        onCreateInspection={async () => {}}
        onRecordInspectionResult={async () => {}}
        onCreateReworkOperation={async () => {
          invoked = true;
        }}
        onRecordInspectionScrap={async () => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create rework operation' }));

    await waitFor(() => {
      expect(invoked).toBe(true);
    });
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('submits scrap handling for failed inspections with failed quantity', async () => {
    const inspection: Inspection = {
      id: 12,
      operationId: 5,
      status: 'failed',
      notes: 'Failed lot',
      passedQuantity: 40,
      failedQuantity: 10,
      reworkQuantity: 0,
      scrappedQuantity: null,
      scrapNotes: null,
      scrappedAt: null,
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
    };
    const submitted: Array<{ notes?: string }> = [];

    render(
      <OperationInspectionPanel
        operation={completedOperation}
        inspection={inspection}
        producedQuantity={50}
        onCreateInspection={async () => {}}
        onRecordInspectionResult={async () => {}}
        onCreateReworkOperation={async () => {}}
        onRecordInspectionScrap={async (payload) => {
          submitted.push(payload);
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText('Scrap Notes'), {
      target: { value: 'Scrapped after QC' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record scrap' }));

    await waitFor(() => {
      expect(submitted).toEqual([{ notes: 'Scrapped after QC' }]);
    });
  });

  it('shows recorded scrap details when scrap already exists', () => {
    const inspection: Inspection = {
      id: 13,
      operationId: 5,
      status: 'failed',
      notes: 'Failed lot',
      passedQuantity: 40,
      failedQuantity: 10,
      reworkQuantity: 0,
      scrappedQuantity: 10,
      scrapNotes: 'Scrapped after QC',
      scrappedAt: '2026-03-10T11:00:00.000Z',
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T11:00:00.000Z',
    };

    render(
      <OperationInspectionPanel
        operation={completedOperation}
        inspection={inspection}
        producedQuantity={50}
        onCreateInspection={async () => {}}
        onRecordInspectionResult={async () => {}}
        onCreateReworkOperation={async () => {}}
        onRecordInspectionScrap={async () => {}}
      />,
    );

    expect(screen.getByText('Scrapped Quantity')).toBeInTheDocument();
    expect(screen.getByText('Scrapped after QC')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record scrap' })).not.toBeInTheDocument();
  });

  it('shows recorded rework operation details when rework already exists', () => {
    const inspection: Inspection = {
      id: 14,
      operationId: 5,
      status: 'rework_required',
      notes: 'Rework released',
      passedQuantity: 35,
      failedQuantity: 10,
      reworkQuantity: 5,
      reworkOperationId: 27,
      reworkOperationStatus: 'ready',
      reworkOperationSequence: 10,
      reworkOperationPlannedQuantity: 5,
      reworkCreatedAt: '2026-03-10T11:30:00.000Z',
      scrappedQuantity: null,
      scrapNotes: null,
      scrappedAt: null,
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T11:30:00.000Z',
    };

    render(
      <OperationInspectionPanel
        operation={completedOperation}
        inspection={inspection}
        producedQuantity={50}
        onCreateInspection={async () => {}}
        onRecordInspectionResult={async () => {}}
        onCreateReworkOperation={async () => {}}
        onRecordInspectionScrap={async () => {}}
      />,
    );

    expect(screen.getByText('Rework Operation')).toBeInTheDocument();
    expect(screen.getByText('#27')).toBeInTheDocument();
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create rework operation' })).not.toBeInTheDocument();
  });
});
