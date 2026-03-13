import { NotFoundException, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { InventoryService } from '../src/inventory/inventory.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SalesOrdersService } from '../src/sales-orders/sales-orders.service';

type SalesOrderRecord = {
  id: number;
  customerId: number;
  customerName: string;
  status: string;
  promisedDate: Date | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingPostcode: string | null;
  shippingStateRegion: string | null;
  shippingCountry: string | null;
  salesOrderLines: Array<{
    id: number;
    itemId: number;
    itemCode: string | null;
    itemName: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type ShipmentRecord = {
  id: number;
  number: string | null;
  salesOrderId: number;
  status: string;
  shipDate: Date | null;
  carrierMethod: string | null;
  trackingNumber: string | null;
  deliveredAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ShipmentLineRecord = {
  id: number;
  shipmentId: number;
  salesOrderLineId: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

type StockLotRecord = {
  id: number;
  itemId: number;
  lotNumber: string;
  quantityOnHand: number;
};

type InvoiceRecord = {
  id: number;
  number: string | null;
  shipmentId: number;
  customerId: number;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type InvoiceLineRecord = {
  id: number;
  invoiceId: number;
  shipmentLineId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
};

type InvoiceStore = {
  salesOrders: SalesOrderRecord[];
  shipments: ShipmentRecord[];
  shipmentLines: ShipmentLineRecord[];
  stockLots: StockLotRecord[];
  invoices: InvoiceRecord[];
  invoiceLines: InvoiceLineRecord[];
  auditEntries: Array<{ salesOrderId: number; toStatus: string }>;
};

function createStore(): InvoiceStore {
  const now = new Date('2026-03-11T12:00:00.000Z');

  return {
    salesOrders: [
      {
        id: 1,
        customerId: 21,
        customerName: 'Aster Fabrication',
        status: 'shipped',
        promisedDate: new Date('2026-03-25T00:00:00.000Z'),
        shippingStreet: 'Plant Road 7',
        shippingCity: 'Berlin',
        shippingPostcode: '10115',
        shippingStateRegion: 'Berlin',
        shippingCountry: 'DE',
        salesOrderLines: [
          {
            id: 101,
            itemId: 1001,
            itemCode: 'FG-1001',
            itemName: 'Enclosure Kit',
            quantity: 10,
            unitPrice: 125,
          },
        ],
      },
      {
        id: 2,
        customerId: 22,
        customerName: 'Berg Systems',
        status: 'invoiced',
        promisedDate: new Date('2026-03-26T00:00:00.000Z'),
        shippingStreet: 'Dock 12',
        shippingCity: 'Munich',
        shippingPostcode: '80331',
        shippingStateRegion: 'Bavaria',
        shippingCountry: 'DE',
        salesOrderLines: [
          {
            id: 201,
            itemId: 1002,
            itemCode: 'FG-1002',
            itemName: 'Panel Set',
            quantity: 6,
            unitPrice: 95,
          },
        ],
      },
    ],
    shipments: [
      {
        id: 801,
        number: 'SHP-00801',
        salesOrderId: 1,
        status: 'shipped',
        shipDate: now,
        carrierMethod: 'DHL Freight',
        trackingNumber: 'TRK-801',
        deliveredAt: null,
        notes: 'Still in transit',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 803,
        number: 'SHP-00803',
        salesOrderId: 1,
        status: 'delivered',
        shipDate: now,
        carrierMethod: 'DHL Freight',
        trackingNumber: 'TRK-803',
        deliveredAt: now,
        notes: 'Delivered and ready to invoice',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 804,
        number: 'SHP-00804',
        salesOrderId: 2,
        status: 'delivered',
        shipDate: now,
        carrierMethod: 'UPS',
        trackingNumber: 'TRK-804',
        deliveredAt: now,
        notes: 'Already invoiced shipment',
        createdAt: now,
        updatedAt: now,
      },
    ],
    shipmentLines: [
      {
        id: 901,
        shipmentId: 801,
        salesOrderLineId: 101,
        quantity: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 903,
        shipmentId: 803,
        salesOrderLineId: 101,
        quantity: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 904,
        shipmentId: 804,
        salesOrderLineId: 201,
        quantity: 2,
        createdAt: now,
        updatedAt: now,
      },
    ],
    stockLots: [
      {
        id: 301,
        itemId: 1001,
        lotNumber: 'FG-LOT-001',
        quantityOnHand: 7,
      },
      {
        id: 302,
        itemId: 1002,
        lotNumber: 'FG-LOT-002',
        quantityOnHand: 4,
      },
    ],
    invoices: [
      {
        id: 701,
        number: 'INV-00701',
        shipmentId: 804,
        customerId: 22,
        status: 'issued',
        issueDate: now,
        dueDate: new Date('2026-03-26T00:00:00.000Z'),
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    invoiceLines: [
      {
        id: 801,
        invoiceId: 701,
        shipmentLineId: 904,
        quantity: 2,
        unitPrice: 95,
        lineTotal: 190,
        createdAt: now,
        updatedAt: now,
      },
    ],
    auditEntries: [],
  };
}

class SalesOrdersServiceMock {
  constructor(private readonly store: InvoiceStore) {}

  async findOne(id: number) {
    const salesOrder = this.store.salesOrders.find((entry) => entry.id === id);
    if (!salesOrder) {
      throw new NotFoundException(`Sales order ${id} not found`);
    }

    return {
      id: salesOrder.id,
      customerId: salesOrder.customerId,
      customerName: salesOrder.customerName,
      status: salesOrder.status,
      promisedDate: salesOrder.promisedDate,
      shippingStreet: salesOrder.shippingStreet,
      shippingCity: salesOrder.shippingCity,
      shippingPostcode: salesOrder.shippingPostcode,
      shippingStateRegion: salesOrder.shippingStateRegion,
      shippingCountry: salesOrder.shippingCountry,
      salesOrderLines: salesOrder.salesOrderLines.map((line) => ({
        ...line,
        lineTotal: line.quantity * line.unitPrice,
      })),
    };
  }
}

class InventoryServiceMock {
  constructor(private readonly store: InvoiceStore) {}

  async listAvailableLotsForItem(itemId: number) {
    return this.store.stockLots
      .filter((entry) => entry.itemId === itemId)
      .map((lot) => ({
        id: lot.id,
        itemId: lot.itemId,
        itemCode: lot.itemId === 1001 ? 'FG-1001' : 'FG-1002',
        itemName: lot.itemId === 1001 ? 'Enclosure Kit' : 'Panel Set',
        lotNumber: lot.lotNumber,
        sourceDocument: 'MO-0301',
        quantityOnHand: lot.quantityOnHand,
        reservedQuantity: 0,
        availableQuantity: lot.quantityOnHand,
        status: lot.quantityOnHand > 0 ? 'available' : 'exhausted',
        receivedOrProducedAt: new Date('2026-03-10T10:00:00.000Z'),
        notes: null,
      }));
  }

  async recordTransaction() {
    return;
  }

  async syncInventoryItemQuantity() {
    return;
  }
}

class PrismaServiceMock {
  private now = new Date('2026-03-11T12:00:00.000Z');
  private nextInvoiceId = 702;
  private nextInvoiceLineId = 802;

  constructor(private readonly store: InvoiceStore) {}

  private salesOrderFor(id: number) {
    return this.store.salesOrders.find((entry) => entry.id === id);
  }

  private shipmentWithRelations(shipment: ShipmentRecord) {
    const salesOrder = this.salesOrderFor(shipment.salesOrderId);
    const shipmentLines = this.store.shipmentLines
      .filter((entry) => entry.shipmentId === shipment.id)
      .sort((left, right) => left.id - right.id)
      .map((line) => ({
        ...line,
        salesOrderLine: salesOrder?.salesOrderLines.find((entry) => entry.id === line.salesOrderLineId),
        shipmentPicks: [],
      }));

    return {
      ...shipment,
      salesOrder: salesOrder
        ? {
            id: salesOrder.id,
            customerId: salesOrder.customerId,
            shippingStreet: salesOrder.shippingStreet,
            shippingCity: salesOrder.shippingCity,
            shippingPostcode: salesOrder.shippingPostcode,
            shippingStateRegion: salesOrder.shippingStateRegion,
            shippingCountry: salesOrder.shippingCountry,
            customer: {
              id: salesOrder.customerId,
              name: salesOrder.customerName,
            },
          }
        : undefined,
      shipmentLines,
    };
  }

  private invoiceWithRelations(invoice: InvoiceRecord) {
    const shipment = this.store.shipments.find((entry) => entry.id === invoice.shipmentId);
    const salesOrder = shipment ? this.salesOrderFor(shipment.salesOrderId) : undefined;
    const invoiceLines = this.store.invoiceLines
      .filter((entry) => entry.invoiceId === invoice.id)
      .sort((left, right) => left.id - right.id)
      .map((line) => {
        const shipmentLine = this.store.shipmentLines.find((entry) => entry.id === line.shipmentLineId);
        return {
          ...line,
          shipmentLine: shipmentLine
            ? {
                ...shipmentLine,
                salesOrderLine: salesOrder?.salesOrderLines.find(
                  (entry) => entry.id === shipmentLine.salesOrderLineId,
                ),
              }
            : undefined,
        };
      });

    return {
      ...invoice,
      shipment: shipment
        ? {
            id: shipment.id,
            number: shipment.number,
            salesOrderId: shipment.salesOrderId,
          }
        : undefined,
      customer: {
        id: invoice.customerId,
        name: salesOrder?.customerName ?? `Customer ${invoice.customerId}`,
      },
      invoiceLines,
    };
  }

  shipment = {
    findUnique: async ({ where }: { where: { id: number } }): Promise<any | null> => {
      const shipment = this.store.shipments.find((entry) => entry.id === where.id) ?? null;
      return shipment ? this.shipmentWithRelations(shipment) : null;
    },
  };

  invoice = {
    findMany: async (): Promise<any[]> => {
      return this.store.invoices
        .slice()
        .sort((left, right) => right.id - left.id)
        .map((invoice) => this.invoiceWithRelations(invoice));
    },
    findUnique: async ({
      where,
    }: {
      where: { id?: number; shipmentId?: number };
    }): Promise<any | null> => {
      const invoice =
        where.id !== undefined
          ? this.store.invoices.find((entry) => entry.id === where.id) ?? null
          : this.store.invoices.find((entry) => entry.shipmentId === where.shipmentId) ?? null;
      return invoice ? this.invoiceWithRelations(invoice) : null;
    },
    create: async ({ data }: { data: any }): Promise<any> => {
      const created: InvoiceRecord = {
        id: this.nextInvoiceId++,
        number: null,
        shipmentId: data.shipmentId,
        customerId: data.customerId,
        status: data.status,
        issueDate: data.issueDate,
        dueDate: data.dueDate ?? null,
        paidAt: null,
        createdAt: this.now,
        updatedAt: this.now,
      };
      this.store.invoices.push(created);

      for (const line of data.invoiceLines.create) {
        this.store.invoiceLines.push({
          id: this.nextInvoiceLineId++,
          invoiceId: created.id,
          shipmentLineId: line.shipmentLineId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          createdAt: this.now,
          updatedAt: this.now,
        });
      }

      return this.invoiceWithRelations(created);
    },
    update: async ({ where, data }: { where: { id: number }; data: any }): Promise<any> => {
      const index = this.store.invoices.findIndex((entry) => entry.id === where.id);
      const updated: InvoiceRecord = {
        ...this.store.invoices[index],
        number: data.number ?? this.store.invoices[index].number,
        status: data.status ?? this.store.invoices[index].status,
        paidAt: data.paidAt !== undefined ? data.paidAt : this.store.invoices[index].paidAt,
        updatedAt: this.now,
      };
      this.store.invoices[index] = updated;
      return this.invoiceWithRelations(updated);
    },
  };

  salesOrder = {
    update: async ({ where, data }: { where: { id: number }; data: { status: string } }) => {
      const index = this.store.salesOrders.findIndex((entry) => entry.id === where.id);
      this.store.salesOrders[index] = {
        ...this.store.salesOrders[index],
        status: data.status,
      };
      return this.store.salesOrders[index];
    },
  };

  salesOrderAudit = {
    create: async ({ data }: { data: { salesOrderId: number; toStatus: string } }) => {
      this.store.auditEntries.push({
        salesOrderId: data.salesOrderId,
        toStatus: data.toStatus,
      });
      return data;
    },
  };
}

describe('ShipmentInvoicesController (e2e)', () => {
  let app: INestApplication;
  let store: InvoiceStore;

  beforeEach(async () => {
    store = createStore();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(new PrismaServiceMock(store))
      .overrideProvider(SalesOrdersService)
      .useValue(new SalesOrdersServiceMock(store))
      .overrideProvider(InventoryService)
      .useValue(new InventoryServiceMock(store))
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a shipment invoice, exposes it in the register, and tracks payment', async () => {
    const createResponse = await request(app.getHttpServer()).post('/shipments/803/invoice');
    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      id: 702,
      number: 'INV-00702',
      shipmentId: 803,
      shipmentNumber: 'SHP-00803',
      salesOrderId: 1,
      salesOrderNumber: 'SO-00001',
      customerId: 21,
      customerName: 'Aster Fabrication',
      status: 'issued',
      totalAmount: 375,
    });
    expect(createResponse.body.invoiceLines).toHaveLength(1);
    expect(createResponse.body.invoiceLines[0]).toMatchObject({
      shipmentLineId: 903,
      salesOrderLineId: 101,
      itemId: 1001,
      quantity: 3,
      unitPrice: 125,
      lineTotal: 375,
    });

    const registerResponse = await request(app.getHttpServer()).get('/invoices');
    expect(registerResponse.status).toBe(200);
    expect(registerResponse.body).toHaveLength(2);
    expect(registerResponse.body[0]).toMatchObject({
      id: 702,
      number: 'INV-00702',
      shipmentId: 803,
      salesOrderId: 1,
      customerName: 'Aster Fabrication',
      status: 'issued',
      totalAmount: 375,
    });

    const detailResponse = await request(app.getHttpServer()).get('/invoices/702');
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(702);
    expect(detailResponse.body.dueDate).toBe('2026-03-25T00:00:00.000Z');

    const payResponse = await request(app.getHttpServer()).post('/shipments/803/invoice/pay');
    expect(payResponse.status).toBe(200);
    expect(payResponse.body.status).toBe('paid');
    expect(payResponse.body.paidAt).not.toBeNull();
  });

  it('returns existing shipment invoices and rejects invalid invoice generation', async () => {
    const existingInvoiceResponse = await request(app.getHttpServer()).get('/shipments/804/invoice');
    expect(existingInvoiceResponse.status).toBe(200);
    expect(existingInvoiceResponse.body).toMatchObject({
      id: 701,
      number: 'INV-00701',
      shipmentId: 804,
      customerId: 22,
      status: 'issued',
      totalAmount: 190,
    });

    const nonDeliveredResponse = await request(app.getHttpServer()).post('/shipments/801/invoice');
    expect(nonDeliveredResponse.status).toBe(400);

    const alreadyInvoicedResponse = await request(app.getHttpServer()).post('/shipments/804/invoice');
    expect(alreadyInvoicedResponse.status).toBe(400);
  });
});
