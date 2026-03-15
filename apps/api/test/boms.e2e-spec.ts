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
  createdAt: Date;
  updatedAt: Date;
};

type BomRecord = {
  id: number;
  itemId: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type BomItemRecord = {
  id: number;
  bomId: number;
  itemId: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private items: ItemRecord[] = [];
  private boms: BomRecord[] = [];
  private bomItems: BomItemRecord[] = [];
  private nextItemId = 1;
  private nextBomId = 1;
  private nextBomItemId = 1;

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
      };
    }): Promise<ItemRecord> => {
      const index = this.items.findIndex((item) => item.id === where.id);
      const found = this.items[index];
      const updated: ItemRecord = {
        ...found,
        name: data.name ?? found.name,
        description: data.description ?? found.description,
        updatedAt: new Date(),
      };
      this.items[index] = updated;
      return updated;
    },
  };

  bom = {
    findUnique: async ({ where }: { where: { id: number } }): Promise<BomRecord | null> =>
      this.boms.find((bom) => bom.id === where.id) ?? null,
    create: async ({
      data,
    }: {
      data: {
        itemId: number;
        name: string;
        description: string | null;
        status: string;
      };
    }): Promise<BomRecord> => {
      const now = new Date();
      const created: BomRecord = {
        id: this.nextBomId++,
        itemId: data.itemId,
        name: data.name,
        description: data.description,
        status: data.status,
        createdAt: now,
        updatedAt: now,
      };
      this.boms.push(created);
      return created;
    },
  };

  bomItem = {
    findMany: async ({ where }: { where: { bomId: number } }): Promise<BomItemRecord[]> =>
      this.bomItems.filter((item) => item.bomId === where.bomId),
    create: async ({
      data,
    }: {
      data: {
        bomId: number;
        itemId: number;
        quantity: number;
      };
    }): Promise<BomItemRecord> => {
      const now = new Date();
      const created: BomItemRecord = {
        id: this.nextBomItemId++,
        bomId: data.bomId,
        itemId: data.itemId,
        quantity: data.quantity,
        createdAt: now,
        updatedAt: now,
      };

      this.bomItems.push(created);
      return created;
    },
  };
}

describe('BomsController (e2e)', () => {
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

  it('creates and views a BOM', async () => {
    const itemResponse = await request(app.getHttpServer()).post('/items').send({
      name: 'Frame Assembly',
      description: 'Finished item',
    });

    const createResponse = await request(app.getHttpServer()).post('/boms').send({
      itemId: itemResponse.body.id,
      name: 'Frame Assembly BOM',
      description: 'Initial BOM header',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.itemId).toBe(itemResponse.body.id);
    expect(createResponse.body.status).toBe('draft');

    const detailResponse = await request(app.getHttpServer()).get(`/boms/${createResponse.body.id}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.name).toBe('Frame Assembly BOM');

    const createBomItemResponse = await request(app.getHttpServer())
      .post(`/boms/${createResponse.body.id}/items`)
      .send({
        itemId: itemResponse.body.id,
        quantity: 3,
      });

    expect(createBomItemResponse.status).toBe(201);
    expect(createBomItemResponse.body.quantity).toBe(3);

    const listBomItemsResponse = await request(app.getHttpServer()).get(
      `/boms/${createResponse.body.id}/items`,
    );
    expect(listBomItemsResponse.status).toBe(200);
    expect(listBomItemsResponse.body).toHaveLength(1);
    expect(listBomItemsResponse.body[0].itemId).toBe(itemResponse.body.id);
  });

  it('rejects invalid input and missing resources', async () => {
    const invalidPayload = await request(app.getHttpServer()).post('/boms').send({
      itemId: 0,
      name: '',
    });
    expect(invalidPayload.status).toBe(400);

    const missingItem = await request(app.getHttpServer()).post('/boms').send({
      itemId: 999,
      name: 'Missing item BOM',
    });
    expect(missingItem.status).toBe(404);

    const missingBom = await request(app.getHttpServer()).get('/boms/999');
    expect(missingBom.status).toBe(404);

    const invalidBomItem = await request(app.getHttpServer()).post('/boms/1/items').send({
      itemId: 0,
      quantity: 0,
    });
    expect(invalidBomItem.status).toBe(400);

    const missingBomForItems = await request(app.getHttpServer()).post('/boms/999/items').send({
      itemId: 1,
      quantity: 2,
    });
    expect(missingBomForItems.status).toBe(404);
  });
});
