import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { ItemsService } from '../src/items/items.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SuppliersService } from '../src/purchasing/suppliers.service';

type SupplierRecord = {
  id: number;
  code: string | null;
  name: string;
};

type ItemRecord = {
  id: number;
  code: string | null;
  name: string;
  isActive: boolean;
  unitOfMeasure: string;
  reorderPoint: number;
};

type PurchaseOrderRecord = {
  id: number;
  number: string | null;
  supplierId: number;
  status: string;
  supplierReference: string | null;
  orderDate: Date;
  expectedDate: Date | null;
  buyer: string | null;
  currency: string;
  paymentTerm: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PurchaseOrderLineRecord = {
  id: number;
  purchaseOrderId: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
};

type InventoryItemRecord = {
  id: number;
  itemId: number;
  quantityOnHand: number;
  createdAt: Date;
  updatedAt: Date;
};

type StockLotRecord = {
  id: number;
  itemId: number;
  lotNumber: string;
  quantityOnHand: number;
  sourceType: string | null;
  sourceReference: string | null;
  receivedAt: Date | null;
  status: string;
  notes: string | null;
  sourceWorkOrderId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type InventoryTransactionRecord = {
  id: number;
  inventoryItemId: number;
  itemId: number;
  stockLotId: number | null;
  purchaseOrderLineId: number | null;
  transactionType: string;
  quantity: number;
  referenceType: string | null;
  referenceId: number | null;
  referenceNumber: string | null;
  transactionDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private now = new Date('2026-03-11T10:00:00.000Z');

  private suppliers: SupplierRecord[] = [
    {
      id: 1,
      code: 'SUP-001',
      name: 'Nova Metals GmbH',
    },
  ];

  private items: ItemRecord[] = [
    {
      id: 1001,
      code: 'RM-AL-10',
      name: 'Aluminum Plate 10mm',
      isActive: true,
      unitOfMeasure: 'pcs',
      reorderPoint: 2,
    },
  ];

  private purchaseOrders: PurchaseOrderRecord[] = [];
  private purchaseOrderLines: PurchaseOrderLineRecord[] = [];
  private inventoryItems: InventoryItemRecord[] = [];
  private stockLots: StockLotRecord[] = [];
  private inventoryTransactions: InventoryTransactionRecord[] = [];

  private nextPurchaseOrderId = 1;
  private nextPurchaseOrderLineId = 1;
  private nextInventoryItemId = 1;
  private nextStockLotId = 1;
  private nextInventoryTransactionId = 1;

  private supplierFor(id: number): SupplierRecord {
    const supplier = this.suppliers.find((entry) => entry.id === id);
    if (!supplier) {
      throw new Error(`Supplier ${id} not found`);
    }

    return supplier;
  }

  private itemFor(id: number): ItemRecord {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) {
      throw new Error(`Item ${id} not found`);
    }

    return item;
  }

  private attachPurchaseOrderRelations(purchaseOrder: PurchaseOrderRecord, include?: any) {
    const result: any = { ...purchaseOrder };

    if (include?.supplier) {
      result.supplier = this.supplierFor(purchaseOrder.supplierId);
    }

    if (include?.purchaseOrderLines) {
      const lines = this.purchaseOrderLines
        .filter((entry) => entry.purchaseOrderId === purchaseOrder.id)
        .sort((left, right) => left.id - right.id)
        .map((line) => this.attachPurchaseOrderLineRelations(line, include.purchaseOrderLines));
      result.purchaseOrderLines = lines;
    }

    return result;
  }

  private attachPurchaseOrderLineRelations(line: PurchaseOrderLineRecord, includeOrSelect?: any) {
    const result: any = { ...line };

    if (includeOrSelect?.include?.item || includeOrSelect?.item) {
      result.item = this.itemFor(line.itemId);
    }

    return result;
  }

  private attachLotRelations(lot: StockLotRecord, include?: any) {
    const result: any = { ...lot };

    if (include?.item) {
      result.item = this.itemFor(lot.itemId);
    }

    if (include?.sourceWorkOrder) {
      result.sourceWorkOrder = lot.sourceWorkOrderId
        ? {
            id: lot.sourceWorkOrderId,
          }
        : null;
    }

    return result;
  }

  item = {
    findMany: async ({ where, select }: { where?: any; select?: any } = {}): Promise<any[]> => {
      const items = this.items.filter((entry) => (where?.isActive === undefined ? true : entry.isActive));

      if (!select) {
        return items.map((entry) => ({ ...entry }));
      }

      return items.map((entry) => ({
        id: select.id ? entry.id : undefined,
        code: select.code ? entry.code : undefined,
        name: select.name ? entry.name : undefined,
        unitOfMeasure: select.unitOfMeasure ? entry.unitOfMeasure : undefined,
        reorderPoint: select.reorderPoint ? entry.reorderPoint : undefined,
      }));
    },
    findUnique: async ({ where, select }: { where: { id: number }; select?: any }): Promise<any> => {
      const item = this.items.find((entry) => entry.id === where.id) ?? null;
      if (!item || !select) {
        return item ? { ...item } : null;
      }

      return {
        id: select.id ? item.id : undefined,
        code: select.code ? item.code : undefined,
        name: select.name ? item.name : undefined,
        unitOfMeasure: select.unitOfMeasure ? item.unitOfMeasure : undefined,
        reorderPoint: select.reorderPoint ? item.reorderPoint : undefined,
      };
    },
  };

  purchaseOrder = {
    findMany: async ({ include }: { include?: any } = {}): Promise<any[]> => {
      return this.purchaseOrders
        .slice()
        .sort((left, right) => right.id - left.id)
        .map((purchaseOrder) => this.attachPurchaseOrderRelations(purchaseOrder, include));
    },
    findUnique: async ({
      where,
      include,
    }: {
      where: { id: number };
      include?: any;
    }): Promise<any | null> => {
      const purchaseOrder = this.purchaseOrders.find((entry) => entry.id === where.id) ?? null;
      return purchaseOrder ? this.attachPurchaseOrderRelations(purchaseOrder, include) : null;
    },
    create: async ({ data, include }: { data: any; include?: any }): Promise<any> => {
      const created: PurchaseOrderRecord = {
        id: this.nextPurchaseOrderId++,
        number: null,
        supplierId: data.supplierId,
        status: data.status,
        supplierReference: data.supplierReference ?? null,
        orderDate: data.orderDate,
        expectedDate: data.expectedDate ?? null,
        buyer: data.buyer ?? null,
        currency: data.currency,
        paymentTerm: data.paymentTerm ?? null,
        notes: data.notes ?? null,
        createdAt: this.now,
        updatedAt: this.now,
      };
      this.purchaseOrders.push(created);
      return this.attachPurchaseOrderRelations(created, include);
    },
    update: async ({ where, data, include }: { where: { id: number }; data: any; include?: any }): Promise<any> => {
      const index = this.purchaseOrders.findIndex((entry) => entry.id === where.id);
      const updated: PurchaseOrderRecord = {
        ...this.purchaseOrders[index],
        number: data.number ?? this.purchaseOrders[index].number,
        status: data.status ?? this.purchaseOrders[index].status,
        updatedAt: this.now,
      };
      this.purchaseOrders[index] = updated;
      return this.attachPurchaseOrderRelations(updated, include);
    },
  };

  purchaseOrderLine = {
    findMany: async ({
      where,
      include,
      select,
    }: {
      where?: any;
      include?: any;
      select?: any;
    } = {}): Promise<any[]> => {
      let lines = this.purchaseOrderLines.slice();

      if (where?.purchaseOrderId !== undefined) {
        lines = lines.filter((entry) => entry.purchaseOrderId === where.purchaseOrderId);
      }

      if (where?.itemId?.in) {
        lines = lines.filter((entry) => where.itemId.in.includes(entry.itemId));
      }

      lines = lines.sort((left, right) => left.id - right.id);

      if (select) {
        return lines.map((line) => ({
          id: select.id ? line.id : undefined,
          itemId: select.itemId ? line.itemId : undefined,
          quantity: select.quantity ? line.quantity : undefined,
        }));
      }

      return lines.map((line) => this.attachPurchaseOrderLineRelations(line, include));
    },
    findUnique: async ({
      where,
      include,
    }: {
      where: { id: number };
      include?: any;
    }): Promise<any | null> => {
      const line = this.purchaseOrderLines.find((entry) => entry.id === where.id) ?? null;
      return line ? this.attachPurchaseOrderLineRelations(line, { include }) : null;
    },
    create: async ({ data, include }: { data: any; include?: any }): Promise<any> => {
      const created: PurchaseOrderLineRecord = {
        id: this.nextPurchaseOrderLineId++,
        purchaseOrderId: data.purchaseOrderId,
        itemId: data.itemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        lineTotal: data.lineTotal,
        createdAt: this.now,
        updatedAt: this.now,
      };
      this.purchaseOrderLines.push(created);
      return this.attachPurchaseOrderLineRelations(created, { include });
    },
  };

  inventoryItem = {
    findUnique: async ({
      where,
    }: {
      where: { id?: number; itemId?: number };
    }): Promise<InventoryItemRecord | null> => {
      if (where.id !== undefined) {
        return this.inventoryItems.find((entry) => entry.id === where.id) ?? null;
      }

      return this.inventoryItems.find((entry) => entry.itemId === where.itemId) ?? null;
    },
    create: async ({ data }: { data: any }): Promise<InventoryItemRecord> => {
      const created: InventoryItemRecord = {
        id: this.nextInventoryItemId++,
        itemId: data.itemId,
        quantityOnHand: data.quantityOnHand,
        createdAt: this.now,
        updatedAt: this.now,
      };
      this.inventoryItems.push(created);
      return created;
    },
    update: async ({ where, data }: { where: { id: number }; data: any }): Promise<InventoryItemRecord> => {
      const index = this.inventoryItems.findIndex((entry) => entry.id === where.id);
      const updated: InventoryItemRecord = {
        ...this.inventoryItems[index],
        quantityOnHand: data.quantityOnHand ?? this.inventoryItems[index].quantityOnHand,
        updatedAt: this.now,
      };
      this.inventoryItems[index] = updated;
      return updated;
    },
  };

  stockLot = {
    findUnique: async ({
      where,
      include,
    }: {
      where: { id?: number; lotNumber?: string };
      include?: any;
    }): Promise<any | null> => {
      const lot =
        where.id !== undefined
          ? this.stockLots.find((entry) => entry.id === where.id) ?? null
          : this.stockLots.find((entry) => entry.lotNumber === where.lotNumber) ?? null;
      return lot ? this.attachLotRelations(lot, include) : null;
    },
    create: async ({ data }: { data: any }): Promise<StockLotRecord> => {
      const created: StockLotRecord = {
        id: this.nextStockLotId++,
        itemId: data.itemId,
        lotNumber: data.lotNumber,
        quantityOnHand: data.quantityOnHand,
        sourceType: data.sourceType ?? null,
        sourceReference: data.sourceReference ?? null,
        receivedAt: data.receivedAt ?? null,
        status: data.status,
        notes: data.notes ?? null,
        sourceWorkOrderId: data.sourceWorkOrderId ?? null,
        createdAt: this.now,
        updatedAt: this.now,
      };
      this.stockLots.push(created);
      return created;
    },
    update: async ({ where, data }: { where: { id: number }; data: any }): Promise<StockLotRecord> => {
      const index = this.stockLots.findIndex((entry) => entry.id === where.id);
      const current = this.stockLots[index];
      const updated: StockLotRecord = {
        ...current,
        quantityOnHand: data.quantityOnHand ?? current.quantityOnHand,
        sourceType: data.sourceType ?? current.sourceType,
        sourceReference: data.sourceReference ?? current.sourceReference,
        receivedAt: data.receivedAt ?? current.receivedAt,
        status: data.status ?? current.status,
        notes: data.notes ?? current.notes,
        updatedAt: this.now,
      };
      this.stockLots[index] = updated;
      return updated;
    },
    findMany: async ({ where, include }: { where?: any; include?: any } = {}): Promise<any[]> => {
      let lots = this.stockLots.slice();

      if (where?.itemId?.in) {
        lots = lots.filter((entry) => where.itemId.in.includes(entry.itemId));
      }

      return lots
        .sort((left, right) => left.lotNumber.localeCompare(right.lotNumber))
        .map((lot) => this.attachLotRelations(lot, include));
    },
    aggregate: async ({ where }: { where: { itemId: number } }) => {
      const quantityOnHand = this.stockLots
        .filter((entry) => entry.itemId === where.itemId)
        .reduce((sum, entry) => sum + entry.quantityOnHand, 0);
      return {
        _sum: {
          quantityOnHand,
        },
      };
    },
    groupBy: async ({ where }: { where?: any }) => {
      let lots = this.stockLots.slice();

      if (where?.itemId?.in) {
        lots = lots.filter((entry) => where.itemId.in.includes(entry.itemId));
      }

      const grouped = new Map<number, number>();
      for (const lot of lots) {
        grouped.set(lot.itemId, (grouped.get(lot.itemId) ?? 0) + lot.quantityOnHand);
      }

      return Array.from(grouped.entries()).map(([itemId, quantityOnHand]) => ({
        itemId,
        _sum: {
          quantityOnHand,
        },
      }));
    },
  };

  inventoryTransaction = {
    findMany: async ({ where, include }: { where?: any; include?: any } = {}): Promise<any[]> => {
      let transactions = this.inventoryTransactions.slice();

      if (where?.inventoryItemId !== undefined) {
        transactions = transactions.filter((entry) => entry.inventoryItemId === where.inventoryItemId);
      }

      if (where?.itemId !== undefined) {
        transactions = transactions.filter((entry) => entry.itemId === where.itemId);
      }

      if (where?.purchaseOrderLineId?.in) {
        transactions = transactions.filter(
          (entry) =>
            entry.purchaseOrderLineId !== null &&
            where.purchaseOrderLineId.in.includes(entry.purchaseOrderLineId),
        );
      }

      if (where?.transactionType?.in) {
        transactions = transactions.filter((entry) =>
          where.transactionType.in.includes(entry.transactionType),
        );
      } else if (where?.transactionType) {
        transactions = transactions.filter((entry) => entry.transactionType === where.transactionType);
      }

      transactions = transactions.sort((left, right) => {
        const dateDelta = right.transactionDate.getTime() - left.transactionDate.getTime();
        if (dateDelta !== 0) {
          return dateDelta;
        }

        return right.id - left.id;
      });

      return transactions.map((transaction) => {
        const result: any = { ...transaction };

        if (include?.stockLot) {
          result.stockLot =
            transaction.stockLotId !== null
              ? {
                  id: transaction.stockLotId,
                  lotNumber: this.stockLots.find((entry) => entry.id === transaction.stockLotId)?.lotNumber,
                }
              : null;
        }

        if (include?.item) {
          result.item = this.itemFor(transaction.itemId);
        }

        return result;
      });
    },
    create: async ({ data }: { data: any }): Promise<InventoryTransactionRecord> => {
      const created: InventoryTransactionRecord = {
        id: this.nextInventoryTransactionId++,
        inventoryItemId: data.inventoryItemId,
        itemId: data.itemId,
        stockLotId: data.stockLotId ?? null,
        purchaseOrderLineId: data.purchaseOrderLineId ?? null,
        transactionType: data.transactionType,
        quantity: data.quantity,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        referenceNumber: data.referenceNumber ?? null,
        transactionDate: data.transactionDate ?? this.now,
        notes: data.notes ?? null,
        createdAt: this.now,
        updatedAt: this.now,
      };
      this.inventoryTransactions.push(created);
      return created;
    },
  };

  materialBooking = {
    findMany: async (): Promise<any[]> => [],
  };

  shipmentPick = {
    findMany: async (): Promise<any[]> => [],
  };

  workOrder = {
    findMany: async (): Promise<any[]> => [],
  };
}

const itemsServiceMock = {
  async findOne(id: number) {
    if (id !== 1001) {
      throw new Error(`Item ${id} not found`);
    }

    return {
      id: 1001,
      code: 'RM-AL-10',
      name: 'Aluminum Plate 10mm',
      unitOfMeasure: 'pcs',
      reorderPoint: 2,
    };
  },
};

const suppliersServiceMock = {
  async ensureSupplierExists(id: number) {
    if (id !== 1) {
      throw new Error(`Supplier ${id} not found`);
    }
  },
};

describe('PurchaseOrdersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(new PrismaServiceMock())
      .overrideProvider(ItemsService)
      .useValue(itemsServiceMock)
      .overrideProvider(SuppliersService)
      .useValue(suppliersServiceMock)
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

  it('creates a purchase order with the MVP-040 header fields', async () => {
    const response = await request(app.getHttpServer()).post('/purchase-orders').send({
      supplierId: 1,
      supplierReference: 'RFQ-204',
      orderDate: '2026-03-11',
      expectedDate: '2026-03-18',
      buyer: 'Lena Hoffmann',
      currency: 'EUR',
      paymentTerm: 'Net 30',
      notes: 'Restock aluminum plate',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      supplierId: 1,
      supplierCode: 'SUP-001',
      supplierName: 'Nova Metals GmbH',
      status: 'draft',
      supplierReference: 'RFQ-204',
      buyer: 'Lena Hoffmann',
      currency: 'EUR',
      paymentTerm: 'Net 30',
      notes: 'Restock aluminum plate',
      openQuantity: 0,
      receivedQuantity: 0,
    });
    expect(response.body.number).toBe('PO00001');
  });

  it('receives a purchase-order line into a lot and exposes it through stock views', async () => {
    const purchaseOrderResponse = await request(app.getHttpServer()).post('/purchase-orders').send({
      supplierId: 1,
      orderDate: '2026-03-11',
      expectedDate: '2026-03-18',
      buyer: 'Lena Hoffmann',
      notes: 'Receiving test',
    });
    expect(purchaseOrderResponse.status).toBe(201);

    const lineResponse = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderResponse.body.id}/lines`)
      .send({
        itemId: 1001,
        quantity: 5,
        unitPrice: 12.5,
      });
    expect(lineResponse.status).toBe(201);
    expect(lineResponse.body).toMatchObject({
      itemId: 1001,
      itemCode: 'RM-AL-10',
      itemName: 'Aluminum Plate 10mm',
      quantity: 5,
      lineTotal: 62.5,
      receivedQuantity: 0,
      remainingQuantity: 5,
    });

    const receiptResponse = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderResponse.body.id}/lines/${lineResponse.body.id}/receive`)
      .send({
        quantity: 5,
        lotNumber: 'AL-2026-001',
        receiptDate: '2026-03-12',
        notes: 'Dock receipt 1',
      });
    expect(receiptResponse.status).toBe(201);
    expect(receiptResponse.body).toMatchObject({
      id: lineResponse.body.id,
      receivedQuantity: 5,
      remainingQuantity: 0,
    });

    const detailResponse = await request(app.getHttpServer()).get(
      `/purchase-orders/${purchaseOrderResponse.body.id}`,
    );
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({
      id: purchaseOrderResponse.body.id,
      number: 'PO00001',
      status: 'received',
      openQuantity: 0,
      receivedQuantity: 5,
    });
    expect(detailResponse.body.lines).toHaveLength(1);
    expect(detailResponse.body.receipts).toHaveLength(1);
    expect(detailResponse.body.receipts[0]).toMatchObject({
      purchaseOrderLineId: lineResponse.body.id,
      lotNumber: 'AL-2026-001',
      quantity: 5,
      notes: 'Dock receipt 1',
    });

    const stockItemsResponse = await request(app.getHttpServer()).get('/stock/items');
    expect(stockItemsResponse.status).toBe(200);
    expect(stockItemsResponse.body).toHaveLength(1);
    expect(stockItemsResponse.body[0]).toMatchObject({
      itemId: 1001,
      itemCode: 'RM-AL-10',
      onHandQuantity: 5,
      availableQuantity: 5,
      expectedQuantity: 0,
    });

    const stockLotsResponse = await request(app.getHttpServer()).get('/stock/lots');
    expect(stockLotsResponse.status).toBe(200);
    expect(stockLotsResponse.body).toHaveLength(1);
    expect(stockLotsResponse.body[0]).toMatchObject({
      itemId: 1001,
      lotNumber: 'AL-2026-001',
      sourceDocument: 'PO00001',
      quantityOnHand: 5,
      availableQuantity: 5,
      status: 'available',
    });

    const stockMovementsResponse = await request(app.getHttpServer()).get('/stock/movements');
    expect(stockMovementsResponse.status).toBe(200);
    expect(stockMovementsResponse.body).toHaveLength(1);
    expect(stockMovementsResponse.body[0]).toMatchObject({
      itemId: 1001,
      lotNumber: 'AL-2026-001',
      movementType: 'purchase_receipt',
      quantity: 5,
      reference: 'PO00001',
      notes: 'Dock receipt 1',
    });
  });

  it('rejects invalid receipt input and over-receipt attempts', async () => {
    const purchaseOrderResponse = await request(app.getHttpServer()).post('/purchase-orders').send({
      supplierId: 1,
    });
    expect(purchaseOrderResponse.status).toBe(201);

    const lineResponse = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderResponse.body.id}/lines`)
      .send({
        itemId: 1001,
        quantity: 5,
        unitPrice: 12.5,
      });
    expect(lineResponse.status).toBe(201);

    const missingLotResponse = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderResponse.body.id}/lines/${lineResponse.body.id}/receive`)
      .send({
        quantity: 2,
      });
    expect(missingLotResponse.status).toBe(400);

    const firstReceipt = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderResponse.body.id}/lines/${lineResponse.body.id}/receive`)
      .send({
        quantity: 3,
        lotNumber: 'AL-2026-002',
      });
    expect(firstReceipt.status).toBe(201);

    const overReceipt = await request(app.getHttpServer())
      .post(`/purchase-orders/${purchaseOrderResponse.body.id}/lines/${lineResponse.body.id}/receive`)
      .send({
        quantity: 3,
        lotNumber: 'AL-2026-002',
      });
    expect(overReceipt.status).toBe(400);
  });
});
