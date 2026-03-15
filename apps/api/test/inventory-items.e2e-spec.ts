import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type ItemRecord = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  defaultRoutingId: number | null;
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

type InventoryTransactionRecord = {
  id: number;
  inventoryItemId: number;
  itemId: number;
  purchaseOrderLineId: number | null;
  transactionType: string;
  quantity: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private items: ItemRecord[] = [];
  private inventoryItems: InventoryItemRecord[] = [];
  private inventoryTransactions: InventoryTransactionRecord[] = [];
  private nextItemId = 1;
  private nextInventoryItemId = 1;
  private nextInventoryTransactionId = 1;

  item = {
    findMany: async (): Promise<ItemRecord[]> => [...this.items],
    findUnique: async ({ where }: { where: { id: number } }): Promise<ItemRecord | null> =>
      this.items.find((item) => item.id === where.id) ?? null,
    create: async ({
      data,
    }: {
      data: {
        name: string;
        description: string | null;
        isActive: boolean;
        defaultRoutingId?: number | null;
      };
    }): Promise<ItemRecord> => {
      const now = new Date();
      const created: ItemRecord = {
        id: this.nextItemId++,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        defaultRoutingId: data.defaultRoutingId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.items.push(created);
      return created;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: {
        name?: string;
        description?: string;
        defaultRoutingId?: number | null;
      };
    }): Promise<ItemRecord> => {
      const index = this.items.findIndex((item) => item.id === where.id);
      const found = this.items[index];
      const updated: ItemRecord = {
        ...found,
        name: data.name ?? found.name,
        description: data.description ?? found.description,
        defaultRoutingId:
          data.defaultRoutingId !== undefined ? data.defaultRoutingId : found.defaultRoutingId,
        updatedAt: new Date(),
      };

      this.items[index] = updated;
      return updated;
    },
  };

  inventoryItem = {
    findMany: async (): Promise<InventoryItemRecord[]> => [...this.inventoryItems],
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
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: {
        quantityOnHand?: number;
      };
    }): Promise<InventoryItemRecord> => {
      const index = this.inventoryItems.findIndex((entry) => entry.id === where.id);
      const found = this.inventoryItems[index];
      const updated: InventoryItemRecord = {
        ...found,
        quantityOnHand:
          data.quantityOnHand !== undefined ? data.quantityOnHand : found.quantityOnHand,
        updatedAt: new Date(),
      };
      this.inventoryItems[index] = updated;
      return updated;
    },
    create: async ({
      data,
    }: {
      data: {
        itemId: number;
        quantityOnHand: number;
      };
    }): Promise<InventoryItemRecord> => {
      const now = new Date();
      const created: InventoryItemRecord = {
        id: this.nextInventoryItemId++,
        itemId: data.itemId,
        quantityOnHand: data.quantityOnHand,
        createdAt: now,
        updatedAt: now,
      };

      this.inventoryItems.push(created);
      return created;
    },
  };

  inventoryTransaction = {
    findMany: async ({
      where,
    }: {
      where: { inventoryItemId: number };
      orderBy?: { id: 'asc' | 'desc' };
    }): Promise<InventoryTransactionRecord[]> =>
      this.inventoryTransactions
        .filter((entry) => entry.inventoryItemId === where.inventoryItemId)
        .sort((left, right) => left.id - right.id),
    create: async ({
      data,
    }: {
      data: {
        inventoryItemId: number;
        itemId: number;
        purchaseOrderLineId?: number | null;
        transactionType: string;
        quantity: number;
        notes: string | null;
      };
    }): Promise<InventoryTransactionRecord> => {
      const now = new Date();
      const created: InventoryTransactionRecord = {
        id: this.nextInventoryTransactionId++,
        inventoryItemId: data.inventoryItemId,
        itemId: data.itemId,
        purchaseOrderLineId: data.purchaseOrderLineId ?? null,
        transactionType: data.transactionType,
        quantity: data.quantity,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };

      this.inventoryTransactions.push(created);
      return created;
    },
  };
}

describe('InventoryController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(new PrismaServiceMock())
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

  it('creates, lists, and views inventory item tracking records', async () => {
    const itemResponse = await request(app.getHttpServer()).post('/items').send({
      name: 'Aluminum Plate 10mm',
      description: 'Raw stock',
    });
    expect(itemResponse.status).toBe(201);

    const createTrackingResponse = await request(app.getHttpServer()).post('/inventory-items').send({
      itemId: itemResponse.body.id,
      quantityOnHand: 120,
    });
    expect(createTrackingResponse.status).toBe(201);
    expect(createTrackingResponse.body.itemId).toBe(itemResponse.body.id);
    expect(createTrackingResponse.body.quantityOnHand).toBe(120);

    const listResponse = await request(app.getHttpServer()).get('/inventory-items');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(createTrackingResponse.body.id);

    const detailResponse = await request(app.getHttpServer()).get(
      `/inventory-items/${createTrackingResponse.body.id}`,
    );
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.itemId).toBe(itemResponse.body.id);
    expect(detailResponse.body.quantityOnHand).toBe(120);
  });

  it('rejects invalid inventory tracking input and duplicate item tracking', async () => {
    const invalidQuantity = await request(app.getHttpServer()).post('/inventory-items').send({
      itemId: 1,
      quantityOnHand: -1,
    });
    expect(invalidQuantity.status).toBe(400);

    const missingItem = await request(app.getHttpServer()).post('/inventory-items').send({
      itemId: 999,
      quantityOnHand: 5,
    });
    expect(missingItem.status).toBe(404);

    const itemResponse = await request(app.getHttpServer()).post('/items').send({
      name: 'Aluminum Plate 10mm',
      description: 'Raw stock',
    });
    expect(itemResponse.status).toBe(201);

    const firstCreate = await request(app.getHttpServer()).post('/inventory-items').send({
      itemId: itemResponse.body.id,
      quantityOnHand: 50,
    });
    expect(firstCreate.status).toBe(201);

    const duplicate = await request(app.getHttpServer()).post('/inventory-items').send({
      itemId: itemResponse.body.id,
      quantityOnHand: 10,
    });
    expect(duplicate.status).toBe(400);

    const missingInventoryItem = await request(app.getHttpServer()).get('/inventory-items/999');
    expect(missingInventoryItem.status).toBe(404);
  });

  it('issues material and records inventory transactions', async () => {
    const itemResponse = await request(app.getHttpServer()).post('/items').send({
      name: 'Aluminum Plate 10mm',
      description: 'Raw stock',
    });
    expect(itemResponse.status).toBe(201);

    const trackingResponse = await request(app.getHttpServer()).post('/inventory-items').send({
      itemId: itemResponse.body.id,
      quantityOnHand: 120,
    });
    expect(trackingResponse.status).toBe(201);

    const issueResponse = await request(app.getHttpServer())
      .post(`/inventory-items/${trackingResponse.body.id}/issue`)
      .send({
        quantity: 30,
        notes: 'Manual issue to shop floor',
      });
    expect(issueResponse.status).toBe(201);
    expect(issueResponse.body.transactionType).toBe('issue');
    expect(issueResponse.body.quantity).toBe(30);
    expect(issueResponse.body.notes).toBe('Manual issue to shop floor');

    const detailAfterIssue = await request(app.getHttpServer()).get(
      `/inventory-items/${trackingResponse.body.id}`,
    );
    expect(detailAfterIssue.status).toBe(200);
    expect(detailAfterIssue.body.quantityOnHand).toBe(90);

    const transactionsResponse = await request(app.getHttpServer()).get(
      `/inventory-items/${trackingResponse.body.id}/transactions`,
    );
    expect(transactionsResponse.status).toBe(200);
    expect(transactionsResponse.body).toHaveLength(1);
    expect(transactionsResponse.body[0].transactionType).toBe('issue');
    expect(transactionsResponse.body[0].quantity).toBe(30);
    expect(transactionsResponse.body[0].purchaseOrderLineId).toBeNull();

    const insufficientStock = await request(app.getHttpServer())
      .post(`/inventory-items/${trackingResponse.body.id}/issue`)
      .send({
        quantity: 1000,
      });
    expect(insufficientStock.status).toBe(400);

    const invalidIssueQuantity = await request(app.getHttpServer())
      .post(`/inventory-items/${trackingResponse.body.id}/issue`)
      .send({
        quantity: 0,
      });
    expect(invalidIssueQuantity.status).toBe(400);

    const missingIssueTarget = await request(app.getHttpServer()).post('/inventory-items/999/issue').send({
      quantity: 1,
    });
    expect(missingIssueTarget.status).toBe(404);

    const missingTransactionList = await request(app.getHttpServer()).get(
      '/inventory-items/999/transactions',
    );
    expect(missingTransactionList.status).toBe(404);
  });

  it('adjusts inventory and records adjustment transactions', async () => {
    const itemResponse = await request(app.getHttpServer()).post('/items').send({
      name: 'Aluminum Plate 10mm',
      description: 'Raw stock',
    });
    expect(itemResponse.status).toBe(201);

    const trackingResponse = await request(app.getHttpServer()).post('/inventory-items').send({
      itemId: itemResponse.body.id,
      quantityOnHand: 20,
    });
    expect(trackingResponse.status).toBe(201);

    const positiveAdjustment = await request(app.getHttpServer())
      .post(`/inventory-items/${trackingResponse.body.id}/adjust`)
      .send({
        delta: 5,
        notes: 'Cycle count increase',
      });
    expect(positiveAdjustment.status).toBe(201);
    expect(positiveAdjustment.body.transactionType).toBe('adjustment');
    expect(positiveAdjustment.body.quantity).toBe(5);
    expect(positiveAdjustment.body.purchaseOrderLineId).toBeNull();

    const negativeAdjustment = await request(app.getHttpServer())
      .post(`/inventory-items/${trackingResponse.body.id}/adjust`)
      .send({
        delta: -8,
        notes: 'Damaged stock correction',
      });
    expect(negativeAdjustment.status).toBe(201);
    expect(negativeAdjustment.body.transactionType).toBe('adjustment');
    expect(negativeAdjustment.body.quantity).toBe(-8);

    const detailAfterAdjustments = await request(app.getHttpServer()).get(
      `/inventory-items/${trackingResponse.body.id}`,
    );
    expect(detailAfterAdjustments.status).toBe(200);
    expect(detailAfterAdjustments.body.quantityOnHand).toBe(17);

    const transactionsResponse = await request(app.getHttpServer()).get(
      `/inventory-items/${trackingResponse.body.id}/transactions`,
    );
    expect(transactionsResponse.status).toBe(200);
    expect(transactionsResponse.body).toHaveLength(2);
    expect(transactionsResponse.body[0].transactionType).toBe('adjustment');
    expect(transactionsResponse.body[0].quantity).toBe(5);
    expect(transactionsResponse.body[1].transactionType).toBe('adjustment');
    expect(transactionsResponse.body[1].quantity).toBe(-8);

    const zeroAdjustment = await request(app.getHttpServer())
      .post(`/inventory-items/${trackingResponse.body.id}/adjust`)
      .send({
        delta: 0,
      });
    expect(zeroAdjustment.status).toBe(400);

    const underflowAdjustment = await request(app.getHttpServer())
      .post(`/inventory-items/${trackingResponse.body.id}/adjust`)
      .send({
        delta: -100,
      });
    expect(underflowAdjustment.status).toBe(400);

    const missingAdjustmentTarget = await request(app.getHttpServer())
      .post('/inventory-items/999/adjust')
      .send({
        delta: 1,
      });
    expect(missingAdjustmentTarget.status).toBe(404);
  });
});
