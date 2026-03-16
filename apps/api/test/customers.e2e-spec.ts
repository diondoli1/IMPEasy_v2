import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type CustomerRecord = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private customers: CustomerRecord[] = [];
  private nextId = 1;

  customer = {
    findMany: async (): Promise<CustomerRecord[]> => [...this.customers],
    findUnique: async ({ where }: { where: { id: number } }): Promise<CustomerRecord | null> =>
      this.customers.find((customer) => customer.id === where.id) ?? null,
    create: async ({
      data,
    }: {
      data: {
        name: string;
        email: string | null;
        phone: string | null;
        isActive: boolean;
      };
    }): Promise<CustomerRecord> => {
      const now = new Date();
      const created: CustomerRecord = {
        id: this.nextId++,
        name: data.name,
        email: data.email,
        phone: data.phone,
        isActive: data.isActive,
        createdAt: now,
        updatedAt: now,
      };

      this.customers.push(created);
      return created;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: {
        name?: string;
        email?: string;
        phone?: string;
      };
    }): Promise<CustomerRecord> => {
      const index = this.customers.findIndex((customer) => customer.id === where.id);
      const found = this.customers[index];

      const updated: CustomerRecord = {
        ...found,
        name: data.name ?? found.name,
        email: data.email ?? found.email,
        phone: data.phone ?? found.phone,
        updatedAt: new Date(),
      };

      this.customers[index] = updated;
      return updated;
    },
  };
}

describe('CustomersController (e2e)', () => {
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

  it('creates, lists, views, and updates a customer', async () => {
    const createResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Acme Industries',
      email: 'ops@acme.test',
      phone: '+1 555 000 1234',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.name).toBe('Acme Industries');
    expect(createResponse.body.isActive).toBe(true);
    expect(createResponse.body.code).toBeDefined();
    expect(typeof createResponse.body.code).toBe('string');
    expect(createResponse.body.code.length).toBeGreaterThan(0);

    const listResponse = await request(app.getHttpServer()).get('/customers');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const detailResponse = await request(app.getHttpServer()).get('/customers/1');
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.email).toBe('ops@acme.test');

    const updateResponse = await request(app.getHttpServer()).patch('/customers/1').send({
      name: 'Acme Industries Europe',
      phone: '+49 30 1234567',
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Acme Industries Europe');
    expect(updateResponse.body.phone).toBe('+49 30 1234567');
  });

  it('rejects invalid input and returns 404 for missing customer', async () => {
    const invalidCreate = await request(app.getHttpServer()).post('/customers').send({
      name: '',
      email: 'not-an-email',
    });

    expect(invalidCreate.status).toBe(400);

    const missingResponse = await request(app.getHttpServer()).get('/customers/999');
    expect(missingResponse.status).toBe(404);
  });
});
