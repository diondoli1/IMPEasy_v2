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

type ShipmentPickRecord = {
  id: number;
  shipmentLineId: number;
  stockLotId: number;
  quantity: number;
  notes: string | null;
  pickedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type StockLotRecord = {
  id: number;
  itemId: number;
  lotNumber: string;
  quantityOnHand: number;
};

type ShippingStore = {
  salesOrders: SalesOrderRecord[];
  shipments: ShipmentRecord[];
  shipmentLines: ShipmentLineRecord[];
  shipmentPicks: ShipmentPickRecord[];
  stockLots: StockLotRecord[];
  auditEntries: Array<{ salesOrderId: number; toStatus: string }>;
};

function createStore(): ShippingStore {
  const now = new Date('2026-03-11T11:00:00.000Z');

  return {
    salesOrders: [
      {
        id: 1,
        customerId: 21,
        customerName: 'Aster Fabrication',
        status: 'released',
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
        customerName: 'Blocked Order',
        status: 'confirmed',
        shippingStreet: 'Warehouse 2',
        shippingCity: 'Hamburg',
        shippingPostcode: '20095',
        shippingStateRegion: 'Hamburg',
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
    shipments: [],
    shipmentLines: [],
    shipmentPicks: [],
    stockLots: [
      {
        id: 301,
        itemId: 1001,
        lotNumber: 'FG-LOT-001',
        quantityOnHand: 10,
      },
    ],
    auditEntries: [],
  };
}

class SalesOrdersServiceMock {
  constructor(private readonly store: ShippingStore) {}

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
  constructor(private readonly store: ShippingStore) {}

  async listAvailableLotsForItem(
    itemId: number,
    options?: {
      includePickedForShipmentId?: number;
    },
  ) {
    const lots = this.store.stockLots.filter((entry) => entry.itemId === itemId);

    return lots.map((lot) => {
      const reservedQuantity = this.store.shipmentPicks
        .filter((pick) => {
          if (pick.stockLotId !== lot.id) {
            return false;
          }

          const line = this.store.shipmentLines.find((entry) => entry.id === pick.shipmentLineId);
          if (!line) {
            return false;
          }

          const shipment = this.store.shipments.find((entry) => entry.id === line.shipmentId);
          if (!shipment || !['draft', 'picked'].includes(shipment.status)) {
            return false;
          }

          if (
            options?.includePickedForShipmentId &&
            shipment.id === options.includePickedForShipmentId
          ) {
            return false;
          }

          return true;
        })
        .reduce((sum, pick) => sum + pick.quantity, 0);

      return {
        id: lot.id,
        itemId: lot.itemId,
        itemCode: lot.itemId === 1001 ? 'FG-1001' : 'FG-1002',
        itemName: lot.itemId === 1001 ? 'Enclosure Kit' : 'Panel Set',
        lotNumber: lot.lotNumber,
        sourceDocument: 'MO-0301',
        quantityOnHand: lot.quantityOnHand,
        reservedQuantity,
        availableQuantity: Math.max(0, lot.quantityOnHand - reservedQuantity),
        status: lot.quantityOnHand - reservedQuantity > 0 ? 'available' : 'fully reserved',
        receivedOrProducedAt: new Date('2026-03-10T10:00:00.000Z'),
        notes: null,
      };
    });
  }

  async recordTransaction() {
    return;
  }

  async syncInventoryItemQuantity() {
    return;
  }
}

class PrismaServiceMock {
  private now = new Date('2026-03-11T11:00:00.000Z');
  private nextShipmentId = 801;
  private nextShipmentLineId = 901;
  private nextShipmentPickId = 1001;

  constructor(private readonly store: ShippingStore) {}

  private shipmentRelations(shipment: ShipmentRecord) {
    const salesOrder = this.store.salesOrders.find((entry) => entry.id === shipment.salesOrderId);
    const shipmentLines = this.store.shipmentLines
      .filter((entry) => entry.shipmentId === shipment.id)
      .sort((left, right) => left.id - right.id)
      .map((line) => {
        const salesOrderLine = salesOrder?.salesOrderLines.find(
          (entry) => entry.id === line.salesOrderLineId,
        );
        const shipmentPicks = this.store.shipmentPicks
          .filter((entry) => entry.shipmentLineId === line.id)
          .sort((left, right) => left.id - right.id)
          .map((pick) => ({
            ...pick,
            stockLot: this.store.stockLots.find((entry) => entry.id === pick.stockLotId),
          }));

        return {
          ...line,
          salesOrderLine: salesOrderLine
            ? {
                ...salesOrderLine,
              }
            : undefined,
          shipmentPicks,
        };
      });

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

  shipment = {
    findMany: async ({ where }: { where?: any } = {}): Promise<any[]> => {
      let shipments = this.store.shipments.slice();

      if (where?.salesOrderId !== undefined) {
        shipments = shipments.filter((entry) => entry.salesOrderId === where.salesOrderId);
      }

      if (where?.status?.in) {
        shipments = shipments.filter((entry) => where.status.in.includes(entry.status));
      }

      return shipments
        .sort((left, right) => right.id - left.id)
        .map((shipment) => this.shipmentRelations(shipment));
    },
    findUnique: async ({ where }: { where: { id: number } }): Promise<any | null> => {
      const shipment = this.store.shipments.find((entry) => entry.id === where.id) ?? null;
      return shipment ? this.shipmentRelations(shipment) : null;
    },
    create: async ({ data }: { data: any }): Promise<any> => {
      const created: ShipmentRecord = {
        id: this.nextShipmentId++,
        number: null,
        salesOrderId: data.salesOrderId,
        status: data.status,
        shipDate: null,
        carrierMethod: data.carrierMethod ?? null,
        trackingNumber: data.trackingNumber ?? null,
        deliveredAt: null,
        notes: data.notes ?? null,
        createdAt: this.now,
        updatedAt: this.now,
      };
      this.store.shipments.push(created);

      for (const line of data.shipmentLines.create) {
        this.store.shipmentLines.push({
          id: this.nextShipmentLineId++,
          shipmentId: created.id,
          salesOrderLineId: line.salesOrderLineId,
          quantity: line.quantity,
          createdAt: this.now,
          updatedAt: this.now,
        });
      }

      return this.shipmentRelations(created);
    },
    update: async ({ where, data }: { where: { id: number }; data: any }): Promise<any> => {
      const index = this.store.shipments.findIndex((entry) => entry.id === where.id);
      const updated: ShipmentRecord = {
        ...this.store.shipments[index],
        number: data.number ?? this.store.shipments[index].number,
        status: data.status ?? this.store.shipments[index].status,
        shipDate: data.shipDate ?? this.store.shipments[index].shipDate,
        carrierMethod:
          data.carrierMethod !== undefined
            ? data.carrierMethod
            : this.store.shipments[index].carrierMethod,
        trackingNumber:
          data.trackingNumber !== undefined
            ? data.trackingNumber
            : this.store.shipments[index].trackingNumber,
        deliveredAt:
          data.deliveredAt !== undefined
            ? data.deliveredAt
            : this.store.shipments[index].deliveredAt,
        notes: data.notes !== undefined ? data.notes : this.store.shipments[index].notes,
        updatedAt: this.now,
      };
      this.store.shipments[index] = updated;
      return this.shipmentRelations(updated);
    },
  };

  shipmentPick = {
    findUnique: async ({
      where,
    }: {
      where: { shipmentLineId_stockLotId: { shipmentLineId: number; stockLotId: number } };
    }): Promise<any | null> => {
      const pick =
        this.store.shipmentPicks.find(
          (entry) =>
            entry.shipmentLineId === where.shipmentLineId_stockLotId.shipmentLineId &&
            entry.stockLotId === where.shipmentLineId_stockLotId.stockLotId,
        ) ?? null;
      return pick ? { ...pick } : null;
    },
    create: async ({ data }: { data: any }): Promise<any> => {
      const created: ShipmentPickRecord = {
        id: this.nextShipmentPickId++,
        shipmentLineId: data.shipmentLineId,
        stockLotId: data.stockLotId,
        quantity: data.quantity,
        notes: data.notes ?? null,
        pickedAt: null,
        createdAt: this.now,
        updatedAt: this.now,
      };
      this.store.shipmentPicks.push(created);
      return created;
    },
    update: async ({ where, data }: { where: { id: number }; data: any }): Promise<any> => {
      const index = this.store.shipmentPicks.findIndex((entry) => entry.id === where.id);
      const updated: ShipmentPickRecord = {
        ...this.store.shipmentPicks[index],
        quantity: data.quantity ?? this.store.shipmentPicks[index].quantity,
        notes: data.notes !== undefined ? data.notes : this.store.shipmentPicks[index].notes,
        pickedAt:
          data.pickedAt !== undefined ? data.pickedAt : this.store.shipmentPicks[index].pickedAt,
        updatedAt: this.now,
      };
      this.store.shipmentPicks[index] = updated;
      return updated;
    },
  };

  stockLot = {
    findUnique: async ({
      where,
      select,
    }: {
      where: { id: number };
      select?: any;
    }): Promise<any | null> => {
      const lot = this.store.stockLots.find((entry) => entry.id === where.id) ?? null;
      if (!lot || !select) {
        return lot ? { ...lot } : null;
      }

      return {
        id: select.id ? lot.id : undefined,
        itemId: select.itemId ? lot.itemId : undefined,
      };
    },
    update: async ({ where, data }: { where: { id: number }; data: any }): Promise<any> => {
      const index = this.store.stockLots.findIndex((entry) => entry.id === where.id);
      const updated: StockLotRecord = {
        ...this.store.stockLots[index],
        quantityOnHand: data.quantityOnHand,
      };
      this.store.stockLots[index] = updated;
      return updated;
    },
  };

  invoice = {
    findUnique: async (): Promise<null> => null,
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

describe('ShipmentsController (e2e)', () => {
  let app: INestApplication;
  let store: ShippingStore;

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

  it('runs the MVP-040 shipment lifecycle from draft allocation through delivery', async () => {
    const availabilityResponse = await request(app.getHttpServer()).get(
      '/sales-orders/1/shipping-availability',
    );
    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body).toHaveLength(1);
    expect(availabilityResponse.body[0]).toMatchObject({
      salesOrderLineId: 101,
      itemId: 1001,
      remainingQuantity: 10,
      availableStockQuantity: 10,
      blockedReason: null,
    });

    const createResponse = await request(app.getHttpServer()).post('/shipments').send({
      salesOrderId: 1,
      carrierMethod: 'DHL Freight',
      trackingNumber: 'TRK-001',
      notes: 'Partial outbound shipment',
      lines: [
        {
          salesOrderLineId: 101,
          quantity: 4,
        },
      ],
    });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      number: 'SHP-00801',
      salesOrderId: 1,
      status: 'draft',
      customerId: 21,
      customerName: 'Aster Fabrication',
      carrierMethod: 'DHL Freight',
      trackingNumber: 'TRK-001',
    });

    const shipmentId = createResponse.body.id;
    const shipmentLineId = createResponse.body.shipmentLines[0].id;

    const allocationResponse = await request(app.getHttpServer())
      .post(`/shipments/${shipmentId}/picks`)
      .send({
        picks: [
          {
            shipmentLineId,
            stockLotId: 301,
            quantity: 4,
            notes: 'Pick first lot',
          },
        ],
      });
    expect(allocationResponse.status).toBe(200);
    expect(allocationResponse.body.lines[0].picks).toHaveLength(1);
    expect(allocationResponse.body.lines[0].picks[0]).toMatchObject({
      stockLotId: 301,
      lotNumber: 'FG-LOT-001',
      quantity: 4,
    });

    const pickResponse = await request(app.getHttpServer()).post(`/shipments/${shipmentId}/pick`);
    expect(pickResponse.status).toBe(200);
    expect(pickResponse.body.status).toBe('picked');

    const shipResponse = await request(app.getHttpServer()).post(`/shipments/${shipmentId}/ship`);
    expect(shipResponse.status).toBe(200);
    expect(shipResponse.body.status).toBe('shipped');

    const deliveredResponse = await request(app.getHttpServer()).post(
      `/shipments/${shipmentId}/deliver`,
    );
    expect(deliveredResponse.status).toBe(200);
    expect(deliveredResponse.body.status).toBe('delivered');

    const detailResponse = await request(app.getHttpServer()).get(`/shipments/${shipmentId}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({
      id: shipmentId,
      number: 'SHP-00801',
      shipToName: 'Aster Fabrication',
    });
    expect(detailResponse.body.shipToAddress).toEqual([
      'Plant Road 7',
      '10115 Berlin',
      'Berlin',
      'DE',
    ]);
    expect(detailResponse.body.lines[0].pickedQuantity).toBe(4);
    expect(detailResponse.body.history.map((entry: { eventType: string }) => entry.eventType)).toEqual(
      expect.arrayContaining(['created', 'picking', 'shipped', 'delivered']),
    );

    const postShipmentAvailability = await request(app.getHttpServer()).get(
      '/sales-orders/1/shipping-availability',
    );
    expect(postShipmentAvailability.status).toBe(200);
    expect(postShipmentAvailability.body[0]).toMatchObject({
      remainingQuantity: 6,
      availableStockQuantity: 6,
    });
  });

  it('rejects blocked orders, over-allocation, and invalid transition attempts', async () => {
    const blockedOrderResponse = await request(app.getHttpServer()).post('/shipments').send({
      salesOrderId: 2,
      lines: [
        {
          salesOrderLineId: 201,
          quantity: 2,
        },
      ],
    });
    expect(blockedOrderResponse.status).toBe(400);

    const createdShipment = await request(app.getHttpServer()).post('/shipments').send({
      salesOrderId: 1,
      lines: [
        {
          salesOrderLineId: 101,
          quantity: 4,
        },
      ],
    });
    expect(createdShipment.status).toBe(201);

    const shipmentId = createdShipment.body.id;
    const shipmentLineId = createdShipment.body.shipmentLines[0].id;

    const overAllocation = await request(app.getHttpServer())
      .post(`/shipments/${shipmentId}/picks`)
      .send({
        picks: [
          {
            shipmentLineId,
            stockLotId: 301,
            quantity: 11,
          },
        ],
      });
    expect(overAllocation.status).toBe(400);

    const shipWithoutPick = await request(app.getHttpServer()).post(`/shipments/${shipmentId}/ship`);
    expect(shipWithoutPick.status).toBe(400);

    const draftPickAttempt = await request(app.getHttpServer()).post(`/shipments/${shipmentId}/pick`);
    expect(draftPickAttempt.status).toBe(400);
  });
});
