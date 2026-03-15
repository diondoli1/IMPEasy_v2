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

class PrismaServiceMock {
  private items: ItemRecord[] = [];
  private nextItemId = 1;

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
}

describe('ItemsController (e2e)', () => {
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

  it('creates, lists, views, and updates an item', async () => {
    const createResponse = await request(app.getHttpServer()).post('/items').send({
      name: 'Aluminum Plate 10mm',
      description: 'Raw stock for CNC operations',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Aluminum Plate 10mm');
    expect(createResponse.body.isActive).toBe(true);

    const listResponse = await request(app.getHttpServer()).get('/items');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const detailResponse = await request(app.getHttpServer()).get('/items/1');
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.description).toBe('Raw stock for CNC operations');

    const updateResponse = await request(app.getHttpServer()).patch('/items/1').send({
      name: 'Aluminum Plate 12mm',
      description: 'Updated stock thickness',
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Aluminum Plate 12mm');
    expect(updateResponse.body.description).toBe('Updated stock thickness');
  });

  it('rejects invalid input and returns 404 for missing item', async () => {
    const invalidCreate = await request(app.getHttpServer()).post('/items').send({
      name: '',
    });

    expect(invalidCreate.status).toBe(400);

    const missingResponse = await request(app.getHttpServer()).get('/items/999');
    expect(missingResponse.status).toBe(404);
  });
});
