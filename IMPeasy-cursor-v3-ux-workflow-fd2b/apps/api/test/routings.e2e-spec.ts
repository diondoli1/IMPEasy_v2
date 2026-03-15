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

type RoutingRecord = {
  id: number;
  itemId: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type RoutingOperationRecord = {
  id: number;
  routingId: number;
  sequence: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private items: ItemRecord[] = [];
  private routings: RoutingRecord[] = [];
  private routingOperations: RoutingOperationRecord[] = [];
  private nextItemId = 1;
  private nextRoutingId = 1;
  private nextRoutingOperationId = 1;

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
      };
    }): Promise<ItemRecord> => {
      const now = new Date();
      const created: ItemRecord = {
        id: this.nextItemId++,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        defaultRoutingId: null,
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

  routing = {
    findMany: async ({
      where,
    }: {
      where: { itemId: number };
    }): Promise<RoutingRecord[]> =>
      this.routings.filter((routing) => routing.itemId === where.itemId).sort((a, b) => a.id - b.id),
    findUnique: async ({
      where,
    }: {
      where: { id: number };
    }): Promise<RoutingRecord | null> =>
      this.routings.find((routing) => routing.id === where.id) ?? null,
    create: async ({
      data,
    }: {
      data: {
        itemId: number;
        name: string;
        description: string | null;
        status: string;
      };
    }): Promise<RoutingRecord> => {
      const now = new Date();
      const created: RoutingRecord = {
        id: this.nextRoutingId++,
        itemId: data.itemId,
        name: data.name,
        description: data.description,
        status: data.status,
        createdAt: now,
        updatedAt: now,
      };
      this.routings.push(created);
      return created;
    },
  };

  routingOperation = {
    findMany: async ({
      where,
    }: {
      where: { routingId: number };
    }): Promise<RoutingOperationRecord[]> =>
      this.routingOperations
        .filter((operation) => operation.routingId === where.routingId)
        .sort((left, right) => {
          if (left.sequence !== right.sequence) {
            return left.sequence - right.sequence;
          }

          return left.id - right.id;
        }),
    create: async ({
      data,
    }: {
      data: {
        routingId: number;
        sequence: number;
        name: string;
        description: string | null;
      };
    }): Promise<RoutingOperationRecord> => {
      const now = new Date();
      const created: RoutingOperationRecord = {
        id: this.nextRoutingOperationId++,
        routingId: data.routingId,
        sequence: data.sequence,
        name: data.name,
        description: data.description,
        createdAt: now,
        updatedAt: now,
      };

      this.routingOperations.push(created);
      return created;
    },
  };
}

describe('RoutingsController (e2e)', () => {
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

  it('creates, views, links, and manages routing operations', async () => {
    const itemResponse = await request(app.getHttpServer()).post('/items').send({
      name: 'Frame Assembly',
      description: 'Finished item',
    });

    const createResponse = await request(app.getHttpServer()).post('/routings').send({
      itemId: itemResponse.body.id,
      name: 'Frame Assembly Routing',
      description: 'Initial routing header',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.itemId).toBe(itemResponse.body.id);
    expect(createResponse.body.status).toBe('draft');

    const detailResponse = await request(app.getHttpServer()).get(
      `/routings/${createResponse.body.id}`,
    );
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.name).toBe('Frame Assembly Routing');

    const listByItemResponse = await request(app.getHttpServer()).get(
      `/routings/item/${itemResponse.body.id}`,
    );
    expect(listByItemResponse.status).toBe(200);
    expect(listByItemResponse.body).toHaveLength(1);
    expect(listByItemResponse.body[0].itemId).toBe(itemResponse.body.id);

    const setDefaultResponse = await request(app.getHttpServer()).patch(
      `/routings/${createResponse.body.id}/default`,
    );
    expect(setDefaultResponse.status).toBe(200);
    expect(setDefaultResponse.body).toEqual({
      itemId: itemResponse.body.id,
      routingId: createResponse.body.id,
    });

    const itemDetailResponse = await request(app.getHttpServer()).get(`/items/${itemResponse.body.id}`);
    expect(itemDetailResponse.status).toBe(200);
    expect(itemDetailResponse.body.defaultRoutingId).toBe(createResponse.body.id);

    const createOperationResponse = await request(app.getHttpServer())
      .post(`/routings/${createResponse.body.id}/operations`)
      .send({
        sequence: 10,
        name: 'Laser Cutting',
        description: 'Initial cut operation',
      });
    expect(createOperationResponse.status).toBe(201);
    expect(createOperationResponse.body.sequence).toBe(10);

    const listOperationsResponse = await request(app.getHttpServer()).get(
      `/routings/${createResponse.body.id}/operations`,
    );
    expect(listOperationsResponse.status).toBe(200);
    expect(listOperationsResponse.body).toHaveLength(1);
    expect(listOperationsResponse.body[0].name).toBe('Laser Cutting');
  });

  it('rejects invalid input and missing resources', async () => {
    const invalidPayload = await request(app.getHttpServer()).post('/routings').send({
      itemId: 0,
      name: '',
    });
    expect(invalidPayload.status).toBe(400);

    const missingItem = await request(app.getHttpServer()).post('/routings').send({
      itemId: 999,
      name: 'Missing item routing',
    });
    expect(missingItem.status).toBe(404);

    const missingRouting = await request(app.getHttpServer()).get('/routings/999');
    expect(missingRouting.status).toBe(404);

    const missingItemRoutingList = await request(app.getHttpServer()).get('/routings/item/999');
    expect(missingItemRoutingList.status).toBe(404);

    const invalidOperation = await request(app.getHttpServer())
      .post('/routings/1/operations')
      .send({
        sequence: 0,
        name: '',
      });
    expect(invalidOperation.status).toBe(400);

    const missingRoutingForOperations = await request(app.getHttpServer())
      .post('/routings/999/operations')
      .send({
        sequence: 10,
        name: 'Laser Cutting',
      });
    expect(missingRoutingForOperations.status).toBe(404);

    const missingRoutingOperationList = await request(app.getHttpServer()).get(
      '/routings/999/operations',
    );
    expect(missingRoutingOperationList.status).toBe(404);

    const missingRoutingForDefault = await request(app.getHttpServer()).patch('/routings/999/default');
    expect(missingRoutingForDefault.status).toBe(404);
  });
});
