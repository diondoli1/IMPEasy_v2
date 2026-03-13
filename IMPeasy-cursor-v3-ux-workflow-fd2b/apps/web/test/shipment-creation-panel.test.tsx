import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ShipmentCreationPanel } from '../components/shipment-creation-panel';
import type { Invoice } from '../types/invoice';
import type { Shipment, ShipmentLine, ShippingAvailabilityLine } from '../types/shipment';

const availability: ShippingAvailabilityLine[] = [
  {
    salesOrderLineId: 101,
    itemId: 1001,
    itemCode: 'ITEM-1001',
    itemName: 'Actuator Housing',
    orderedQuantity: 50,
    shippedQuantity: 10,
    remainingQuantity: 40,
    availableStockQuantity: 18,
    qualityClearedQuantity: 30,
    availableToShipQuantity: 20,
    pendingQualityQuantity: 20,
    blockedReason: null,
  },
  {
    salesOrderLineId: 102,
    itemId: 1002,
    itemCode: 'ITEM-1002',
    itemName: 'Control Bracket',
    orderedQuantity: 40,
    shippedQuantity: 0,
    remainingQuantity: 40,
    availableStockQuantity: 0,
    qualityClearedQuantity: 0,
    availableToShipQuantity: 0,
    pendingQualityQuantity: 40,
    blockedReason: 'QC release pending for this line.',
  },
];

function createShipmentLine(
  id: number,
  shipmentId: number,
  quantity: number,
  pickedQuantity: number,
): ShipmentLine {
  return {
    id,
    shipmentId,
    salesOrderLineId: 101,
    itemId: 1001,
    itemCode: 'ITEM-1001',
    itemName: 'Actuator Housing',
    quantity,
    pickedQuantity,
    createdAt: '2026-03-10T12:00:00.000Z',
    updatedAt: '2026-03-10T12:00:00.000Z',
  };
}

function createShipments(): Shipment[] {
  return [
    {
      id: 801,
      number: 'SHP-0801',
      salesOrderId: 1,
      salesOrderNumber: 'SO-0001',
      customerId: 21,
      customerName: 'Acme Industrial',
      status: 'draft',
      shipDate: null,
      carrierMethod: null,
      trackingNumber: null,
      deliveredAt: null,
      notes: 'Existing partial shipment',
      createdAt: '2026-03-10T12:00:00.000Z',
      updatedAt: '2026-03-10T12:00:00.000Z',
      shipmentLines: [createShipmentLine(901, 801, 10, 0)],
    },
    {
      id: 803,
      number: 'SHP-0803',
      salesOrderId: 1,
      salesOrderNumber: 'SO-0001',
      customerId: 21,
      customerName: 'Acme Industrial',
      status: 'picked',
      shipDate: null,
      carrierMethod: null,
      trackingNumber: null,
      deliveredAt: null,
      notes: 'Picked shipment ready to ship',
      createdAt: '2026-03-10T12:10:00.000Z',
      updatedAt: '2026-03-10T12:10:00.000Z',
      shipmentLines: [createShipmentLine(903, 803, 8, 8)],
    },
    {
      id: 804,
      number: 'SHP-0804',
      salesOrderId: 1,
      salesOrderNumber: 'SO-0001',
      customerId: 21,
      customerName: 'Acme Industrial',
      status: 'shipped',
      shipDate: '2026-03-10T12:20:00.000Z',
      carrierMethod: 'Freight',
      trackingNumber: 'TRACK-804',
      deliveredAt: null,
      notes: 'Shipment in transit',
      createdAt: '2026-03-10T12:20:00.000Z',
      updatedAt: '2026-03-10T12:20:00.000Z',
      shipmentLines: [createShipmentLine(904, 804, 6, 6)],
    },
    {
      id: 805,
      number: 'SHP-0805',
      salesOrderId: 1,
      salesOrderNumber: 'SO-0001',
      customerId: 21,
      customerName: 'Acme Industrial',
      status: 'delivered',
      shipDate: '2026-03-10T12:30:00.000Z',
      carrierMethod: 'Freight',
      trackingNumber: 'TRACK-805',
      deliveredAt: '2026-03-10T12:40:00.000Z',
      notes: 'Delivered shipment ready for invoicing',
      createdAt: '2026-03-10T12:30:00.000Z',
      updatedAt: '2026-03-10T12:40:00.000Z',
      shipmentLines: [createShipmentLine(905, 805, 4, 4)],
    },
    {
      id: 806,
      number: 'SHP-0806',
      salesOrderId: 1,
      salesOrderNumber: 'SO-0001',
      customerId: 21,
      customerName: 'Acme Industrial',
      status: 'delivered',
      shipDate: '2026-03-10T12:40:00.000Z',
      carrierMethod: 'Freight',
      trackingNumber: 'TRACK-806',
      deliveredAt: '2026-03-10T12:45:00.000Z',
      notes: 'Delivered and issued invoice shipment',
      createdAt: '2026-03-10T12:40:00.000Z',
      updatedAt: '2026-03-10T12:45:00.000Z',
      shipmentLines: [createShipmentLine(906, 806, 2, 2)],
    },
    {
      id: 807,
      number: 'SHP-0807',
      salesOrderId: 1,
      salesOrderNumber: 'SO-0001',
      customerId: 21,
      customerName: 'Acme Industrial',
      status: 'delivered',
      shipDate: '2026-03-10T12:45:00.000Z',
      carrierMethod: 'Freight',
      trackingNumber: 'TRACK-807',
      deliveredAt: '2026-03-10T12:50:00.000Z',
      notes: 'Delivered and paid invoice shipment',
      createdAt: '2026-03-10T12:45:00.000Z',
      updatedAt: '2026-03-10T12:50:00.000Z',
      shipmentLines: [createShipmentLine(907, 807, 1, 1)],
    },
  ];
}

function createInvoicesByShipmentId(): Record<number, Invoice | undefined> {
  return {
    806: {
      id: 901,
      number: 'INV-0901',
      shipmentId: 806,
      shipmentNumber: 'SHP-0806',
      salesOrderId: 1,
      salesOrderNumber: 'SO-0001',
      customerId: 21,
      customerName: 'Acme Industrial',
      status: 'issued',
      issueDate: '2026-03-10T13:00:00.000Z',
      dueDate: '2026-04-09T13:00:00.000Z',
      totalAmount: 25,
      createdAt: '2026-03-10T13:00:00.000Z',
      updatedAt: '2026-03-10T13:00:00.000Z',
      paidAt: null,
      invoiceLines: [
        {
          id: 1001,
          invoiceId: 901,
          shipmentLineId: 906,
          salesOrderLineId: 101,
          itemId: 1001,
          itemCode: 'ITEM-1001',
          itemName: 'Actuator Housing',
          quantity: 2,
          unitPrice: 12.5,
          lineTotal: 25,
          createdAt: '2026-03-10T13:00:00.000Z',
          updatedAt: '2026-03-10T13:00:00.000Z',
        },
      ],
    },
    807: {
      id: 902,
      number: 'INV-0902',
      shipmentId: 807,
      shipmentNumber: 'SHP-0807',
      salesOrderId: 1,
      salesOrderNumber: 'SO-0001',
      customerId: 21,
      customerName: 'Acme Industrial',
      status: 'paid',
      issueDate: '2026-03-10T13:10:00.000Z',
      dueDate: '2026-04-09T13:10:00.000Z',
      totalAmount: 12.5,
      createdAt: '2026-03-10T13:10:00.000Z',
      updatedAt: '2026-03-10T13:20:00.000Z',
      paidAt: '2026-03-10T13:20:00.000Z',
      invoiceLines: [
        {
          id: 1002,
          invoiceId: 902,
          shipmentLineId: 907,
          salesOrderLineId: 101,
          itemId: 1001,
          itemCode: 'ITEM-1001',
          itemName: 'Actuator Housing',
          quantity: 1,
          unitPrice: 12.5,
          lineTotal: 12.5,
          createdAt: '2026-03-10T13:10:00.000Z',
          updatedAt: '2026-03-10T13:20:00.000Z',
        },
      ],
    },
  };
}

function renderPanel(overrides: Partial<React.ComponentProps<typeof ShipmentCreationPanel>> = {}) {
  const defaultProps: React.ComponentProps<typeof ShipmentCreationPanel> = {
    salesOrderId: 1,
    salesOrderStatus: 'released',
    availability,
    shipments: createShipments(),
    invoicesByShipmentId: createInvoicesByShipmentId(),
    onCreate: async () => {
      throw new Error('not expected');
    },
    onPack: async () => {
      throw new Error('not expected');
    },
    onShip: async () => {
      throw new Error('not expected');
    },
    onDeliver: async () => {
      throw new Error('not expected');
    },
    onGenerateInvoice: async () => {
      throw new Error('not expected');
    },
    onMarkInvoicePaid: async () => {
      throw new Error('not expected');
    },
  };

  return render(<ShipmentCreationPanel {...defaultProps} {...overrides} />);
}

describe('ShipmentCreationPanel', () => {
  it('renders blocked stock state and existing shipments', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'Shipments' })).toBeInTheDocument();
    expect(screen.getByText('QC release pending for this line.')).toBeInTheDocument();
    expect(screen.getByText('Existing partial shipment')).toBeInTheDocument();
    expect(screen.getByText('SHP-0801')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Ship quantity for line 102' })).toBeDisabled();
  });

  it('validates quantity entry before submit', async () => {
    renderPanel({ shipments: [], invoicesByShipmentId: {} });

    fireEvent.click(screen.getByRole('button', { name: 'Create shipment' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter at least one shipment quantity greater than zero.',
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ship quantity for line 101' }), {
      target: { value: '21' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create shipment' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Shipment quantity for line 101 cannot exceed 20.',
      );
    });
  });

  it('submits a valid shipment payload and shows success feedback', async () => {
    const submitted: unknown[] = [];

    renderPanel({
      shipments: [],
      invoicesByShipmentId: {},
      onCreate: async (payload) => {
        submitted.push(payload);

        return {
          id: 802,
          number: 'SHP-0802',
          salesOrderId: 1,
          salesOrderNumber: 'SO-0001',
          customerId: 21,
          customerName: 'Acme Industrial',
          status: 'draft',
          shipDate: null,
          carrierMethod: null,
          trackingNumber: null,
          deliveredAt: null,
          notes: 'Second partial shipment',
          createdAt: '2026-03-10T12:30:00.000Z',
          updatedAt: '2026-03-10T12:30:00.000Z',
          shipmentLines: [createShipmentLine(902, 802, 12, 0)],
        };
      },
    });

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ship quantity for line 101' }), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Shipment notes' }), {
      target: { value: 'Second partial shipment' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create shipment' }));

    await waitFor(() => {
      expect(submitted[0]).toEqual({
        salesOrderId: 1,
        notes: 'Second partial shipment',
        lines: [
          {
            salesOrderLineId: 101,
            quantity: 12,
          },
        ],
      });
      expect(screen.getByText('Shipment #802 created.')).toBeInTheDocument();
    });
  });

  it('picks a draft shipment and updates the rendered status', async () => {
    function Harness(): JSX.Element {
      const [currentShipments, setCurrentShipments] = React.useState<Shipment[]>(createShipments());

      return (
        <ShipmentCreationPanel
          salesOrderId={1}
          salesOrderStatus="released"
          availability={availability}
          shipments={currentShipments}
          invoicesByShipmentId={createInvoicesByShipmentId()}
          onCreate={async () => {
            throw new Error('not expected');
          }}
          onPack={async (shipmentId) => {
            const updatedShipment = {
              ...currentShipments.find((shipment) => shipment.id === shipmentId)!,
              status: 'picked',
              shipmentLines: [createShipmentLine(901, shipmentId, 10, 10)],
            };
            setCurrentShipments((existing) =>
              existing.map((shipment) =>
                shipment.id === shipmentId ? updatedShipment : shipment,
              ),
            );
            return updatedShipment;
          }}
          onShip={async () => {
            throw new Error('not expected');
          }}
          onDeliver={async () => {
            throw new Error('not expected');
          }}
          onGenerateInvoice={async () => {
            throw new Error('not expected');
          }}
          onMarkInvoicePaid={async () => {
            throw new Error('not expected');
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Pick shipment 801' }));

    await waitFor(() => {
      expect(screen.getByText('SHP-0801 picked.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Pick shipment 801' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ship shipment 801' })).toBeInTheDocument();
    });
  });

  it('shows pick, ship, deliver, invoice, and payment actions only for matching shipment and invoice states', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'Pick shipment 801' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ship shipment 803' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deliver shipment 804' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Generate invoice for shipment 805' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mark invoice paid for shipment 806' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Generate invoice for shipment 806' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Mark invoice paid for shipment 807' }),
    ).not.toBeInTheDocument();
  });

  it('ships a picked shipment and updates the rendered status', async () => {
    function Harness(): JSX.Element {
      const [currentShipments, setCurrentShipments] = React.useState<Shipment[]>(createShipments());

      return (
        <ShipmentCreationPanel
          salesOrderId={1}
          salesOrderStatus="released"
          availability={availability}
          shipments={currentShipments}
          invoicesByShipmentId={createInvoicesByShipmentId()}
          onCreate={async () => {
            throw new Error('not expected');
          }}
          onPack={async () => {
            throw new Error('not expected');
          }}
          onShip={async (shipmentId) => {
            const updatedShipment = {
              ...currentShipments.find((shipment) => shipment.id === shipmentId)!,
              status: 'shipped',
              shipDate: '2026-03-10T12:30:00.000Z',
            };
            setCurrentShipments((existing) =>
              existing.map((shipment) =>
                shipment.id === shipmentId ? updatedShipment : shipment,
              ),
            );
            return updatedShipment;
          }}
          onDeliver={async () => {
            throw new Error('not expected');
          }}
          onGenerateInvoice={async () => {
            throw new Error('not expected');
          }}
          onMarkInvoicePaid={async () => {
            throw new Error('not expected');
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Ship shipment 803' }));

    await waitFor(() => {
      expect(screen.getByText('SHP-0803 shipped.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Ship shipment 803' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Deliver shipment 803' })).toBeInTheDocument();
    });
  });

  it('delivers a shipped shipment and updates the rendered status', async () => {
    function Harness(): JSX.Element {
      const [currentShipments, setCurrentShipments] = React.useState<Shipment[]>(createShipments());

      return (
        <ShipmentCreationPanel
          salesOrderId={1}
          salesOrderStatus="released"
          availability={availability}
          shipments={currentShipments}
          invoicesByShipmentId={createInvoicesByShipmentId()}
          onCreate={async () => {
            throw new Error('not expected');
          }}
          onPack={async () => {
            throw new Error('not expected');
          }}
          onShip={async () => {
            throw new Error('not expected');
          }}
          onDeliver={async (shipmentId) => {
            const updatedShipment = {
              ...currentShipments.find((shipment) => shipment.id === shipmentId)!,
              status: 'delivered',
              deliveredAt: '2026-03-10T12:40:00.000Z',
            };
            setCurrentShipments((existing) =>
              existing.map((shipment) =>
                shipment.id === shipmentId ? updatedShipment : shipment,
              ),
            );
            return updatedShipment;
          }}
          onGenerateInvoice={async () => {
            throw new Error('not expected');
          }}
          onMarkInvoicePaid={async () => {
            throw new Error('not expected');
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Deliver shipment 804' }));

    await waitFor(() => {
      expect(screen.getByText('SHP-0804 delivered.')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Deliver shipment 804' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Generate invoice for shipment 804' }),
      ).toBeInTheDocument();
    });
  });

  it('generates an invoice for a delivered shipment and shows invoice details', async () => {
    function Harness(): JSX.Element {
      const [currentInvoicesByShipmentId, setCurrentInvoicesByShipmentId] =
        React.useState<Record<number, Invoice | undefined>>(createInvoicesByShipmentId());

      return (
        <ShipmentCreationPanel
          salesOrderId={1}
          salesOrderStatus="released"
          availability={availability}
          shipments={createShipments()}
          invoicesByShipmentId={currentInvoicesByShipmentId}
          onCreate={async () => {
            throw new Error('not expected');
          }}
          onPack={async () => {
            throw new Error('not expected');
          }}
          onShip={async () => {
            throw new Error('not expected');
          }}
          onDeliver={async () => {
            throw new Error('not expected');
          }}
          onGenerateInvoice={async (shipmentId) => {
            const createdInvoice: Invoice = {
              id: 903,
              number: 'INV-0903',
              shipmentId,
              shipmentNumber: 'SHP-0805',
              salesOrderId: 1,
              salesOrderNumber: 'SO-0001',
              customerId: 21,
              customerName: 'Acme Industrial',
              status: 'issued',
              issueDate: '2026-03-10T13:15:00.000Z',
              dueDate: '2026-04-09T13:15:00.000Z',
              totalAmount: 50,
              createdAt: '2026-03-10T13:15:00.000Z',
              updatedAt: '2026-03-10T13:15:00.000Z',
              paidAt: null,
              invoiceLines: [
                {
                  id: 1003,
                  invoiceId: 903,
                  shipmentLineId: 905,
                  salesOrderLineId: 101,
                  itemId: 1001,
                  itemCode: 'ITEM-1001',
                  itemName: 'Actuator Housing',
                  quantity: 4,
                  unitPrice: 12.5,
                  lineTotal: 50,
                  createdAt: '2026-03-10T13:15:00.000Z',
                  updatedAt: '2026-03-10T13:15:00.000Z',
                },
              ],
            };

            setCurrentInvoicesByShipmentId((existing) => ({
              ...existing,
              [shipmentId]: createdInvoice,
            }));
            return createdInvoice;
          }}
          onMarkInvoicePaid={async () => {
            throw new Error('not expected');
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate invoice for shipment 805' }));

    await waitFor(() => {
      expect(screen.getByText('INV-0903 generated for SHP-0805.')).toBeInTheDocument();
      expect(screen.getByText('INV-0903 (issued) - Total 50')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Generate invoice for shipment 805' }),
      ).not.toBeInTheDocument();
    });
  });

  it('marks an issued invoice as paid and shows paid details', async () => {
    function Harness(): JSX.Element {
      const [currentInvoicesByShipmentId, setCurrentInvoicesByShipmentId] =
        React.useState<Record<number, Invoice | undefined>>(createInvoicesByShipmentId());

      return (
        <ShipmentCreationPanel
          salesOrderId={1}
          salesOrderStatus="released"
          availability={availability}
          shipments={createShipments()}
          invoicesByShipmentId={currentInvoicesByShipmentId}
          onCreate={async () => {
            throw new Error('not expected');
          }}
          onPack={async () => {
            throw new Error('not expected');
          }}
          onShip={async () => {
            throw new Error('not expected');
          }}
          onDeliver={async () => {
            throw new Error('not expected');
          }}
          onGenerateInvoice={async () => {
            throw new Error('not expected');
          }}
          onMarkInvoicePaid={async (shipmentId) => {
            const updatedInvoice: Invoice = {
              ...(currentInvoicesByShipmentId[shipmentId] as Invoice),
              status: 'paid',
              updatedAt: '2026-03-10T13:30:00.000Z',
              paidAt: '2026-03-10T13:30:00.000Z',
            };

            setCurrentInvoicesByShipmentId((existing) => ({
              ...existing,
              [shipmentId]: updatedInvoice,
            }));
            return updatedInvoice;
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Mark invoice paid for shipment 806' }));

    await waitFor(() => {
      expect(screen.getByText('INV-0901 marked paid for SHP-0806.')).toBeInTheDocument();
      expect(
        screen.getByText('INV-0901 (paid) - Total 25 - Paid at 2026-03-10T13:30:00.000Z'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Mark invoice paid for shipment 806' }),
      ).not.toBeInTheDocument();
    });
  });

  it('shows a pick error when the pick request fails', async () => {
    renderPanel({
      onPack: async () => {
        throw new Error('pick failed');
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pick shipment 801' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to pick shipment.');
    });
  });

  it('shows a shipping error when the ship request fails', async () => {
    renderPanel({
      onShip: async () => {
        throw new Error('ship failed');
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ship shipment 803' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to ship shipment.');
    });
  });

  it('shows an invoice generation error when the invoice request fails', async () => {
    renderPanel({
      onGenerateInvoice: async () => {
        throw new Error('invoice failed');
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Generate invoice for shipment 805' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to generate invoice.');
    });
  });

  it('shows a delivery error when the deliver request fails', async () => {
    renderPanel({
      onDeliver: async () => {
        throw new Error('deliver failed');
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Deliver shipment 804' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to deliver shipment.');
    });
  });

  it('shows an invoice payment error when the pay request fails', async () => {
    renderPanel({
      onMarkInvoicePaid: async () => {
        throw new Error('payment failed');
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark invoice paid for shipment 806' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to record invoice payment.');
    });
  });
});
