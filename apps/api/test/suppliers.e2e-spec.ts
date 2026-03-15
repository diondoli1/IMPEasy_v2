import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type SupplierRecord = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private suppliers: SupplierRecord[] = [];
  private nextId = 1;

  supplier = {
    findMany: async (): Promise<SupplierRecord[]> => [...this.suppliers],
    findUnique: async ({ where }: { where: { id: number } }): Promise<SupplierRecord | null> =>
      this.suppliers.find((supplier) => supplier.id === where.id) ?? null,
    create: async ({
      data,
    }: {
      data: {
        name: string;
        email: string | null;
        phone: string | null;
        isActive: boolean;
      };
    }): Promise<SupplierRecord> => {
      const now = new Date();
      const created: SupplierRecord = {
        id: this.nextId++,
        name: data.name,
        email: data.email,
        phone: data.phone,
        isActive: data.isActive,
        createdAt: now,
        updatedAt: now,
      };

      this.suppliers.push(created);
      return created;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: {
        name?: string;
        email?: string | null;
        phone?: string | null;
        isActive?: boolean;
      };
    }): Promise<SupplierRecord> => {
      const index = this.suppliers.findIndex((supplier) => supplier.id === where.id);
      const found = this.suppliers[index];

      const updated: SupplierRecord = {
        ...found,
        name: data.name !== undefined ? data.name : found.name,
        email: data.email !== undefined ? data.email : found.email,
        phone: data.phone !== undefined ? data.phone : found.phone,
        isActive: data.isActive !== undefined ? data.isActive : found.isActive,
        updatedAt: new Date(),
      };

      this.suppliers[index] = updated;
      return updated;
    },
  };
}

describe('SuppliersController (e2e)', () => {
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

  it('creates, lists, views, and updates a supplier', async () => {
    const createResponse = await request(app.getHttpServer()).post('/suppliers').send({
      name: 'Nova Metals GmbH',
      email: 'sales@novametals.test',
      phone: '+49 30 7654321',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Nova Metals GmbH');
    expect(createResponse.body.isActive).toBe(true);

    const listResponse = await request(app.getHttpServer()).get('/suppliers');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(createResponse.body.id);

    const detailResponse = await request(app.getHttpServer()).get(`/suppliers/${createResponse.body.id}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.email).toBe('sales@novametals.test');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/suppliers/${createResponse.body.id}`)
      .send({
        name: 'Nova Metals Europe',
        phone: '+49 30 1234567',
        isActive: false,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Nova Metals Europe');
    expect(updateResponse.body.phone).toBe('+49 30 1234567');
    expect(updateResponse.body.isActive).toBe(false);
  });

  it('trims values on create and allows clearing optional fields on update', async () => {
    const createResponse = await request(app.getHttpServer()).post('/suppliers').send({
      name: '  Nova Metals GmbH  ',
      email: '  sales@novametals.test  ',
      phone: '  +49 30 7654321  ',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Nova Metals GmbH');
    expect(createResponse.body.email).toBe('sales@novametals.test');
    expect(createResponse.body.phone).toBe('+49 30 7654321');

    const updateResponse = await request(app.getHttpServer())
      .patch(`/suppliers/${createResponse.body.id}`)
      .send({
        email: '',
        phone: '   ',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.email).toBeNull();
    expect(updateResponse.body.phone).toBeNull();
  });

  it('rejects invalid input and returns 404 for missing supplier', async () => {
    const createdSupplier = await request(app.getHttpServer()).post('/suppliers').send({
      name: 'Existing Supplier',
    });
    expect(createdSupplier.status).toBe(201);

    const invalidCreate = await request(app.getHttpServer()).post('/suppliers').send({
      name: '   ',
      email: 'not-an-email',
    });
    expect(invalidCreate.status).toBe(400);

    const invalidWhitespaceUpdate = await request(app.getHttpServer())
      .patch(`/suppliers/${createdSupplier.body.id}`)
      .send({
        name: '   ',
      });
    expect(invalidWhitespaceUpdate.status).toBe(400);

    const invalidUpdate = await request(app.getHttpServer())
      .patch(`/suppliers/${createdSupplier.body.id}`)
      .send({
        phone: '123',
      });
    expect(invalidUpdate.status).toBe(400);

    const missingDetail = await request(app.getHttpServer()).get('/suppliers/999');
    expect(missingDetail.status).toBe(404);

    const missingUpdate = await request(app.getHttpServer()).patch('/suppliers/999').send({
      name: 'Updated Name',
    });
    expect(missingUpdate.status).toBe(404);
  });
});
