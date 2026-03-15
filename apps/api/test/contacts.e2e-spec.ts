import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
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

type ContactRecord = {
  id: number;
  customerId: number;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private customers: CustomerRecord[] = [];
  private contacts: ContactRecord[] = [];
  private nextCustomerId = 1;
  private nextContactId = 1;

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
        id: this.nextCustomerId++,
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

  contact = {
    findMany: async ({ where }: { where: { customerId: number } }): Promise<ContactRecord[]> =>
      this.contacts.filter((contact) => contact.customerId === where.customerId),
    findUnique: async ({ where }: { where: { id: number } }): Promise<ContactRecord | null> =>
      this.contacts.find((contact) => contact.id === where.id) ?? null,
    create: async ({
      data,
    }: {
      data: {
        customerId: number;
        name: string;
        email: string | null;
        phone: string | null;
        isActive: boolean;
      };
    }): Promise<ContactRecord> => {
      const now = new Date();
      const created: ContactRecord = {
        id: this.nextContactId++,
        customerId: data.customerId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        isActive: data.isActive,
        createdAt: now,
        updatedAt: now,
      };

      this.contacts.push(created);
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
    }): Promise<ContactRecord> => {
      const index = this.contacts.findIndex((contact) => contact.id === where.id);
      const found = this.contacts[index];

      const updated: ContactRecord = {
        ...found,
        name: data.name ?? found.name,
        email: data.email ?? found.email,
        phone: data.phone ?? found.phone,
        updatedAt: new Date(),
      };

      this.contacts[index] = updated;
      return updated;
    },
  };
}

describe('ContactsController (e2e)', () => {
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

  it('creates, lists, views, and updates contacts for a customer', async () => {
    const customerResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Atlas Manufacturing',
      email: 'ops@atlas.test',
      phone: '+1 555 200 3000',
    });

    const customerId = customerResponse.body.id as number;

    const createResponse = await request(app.getHttpServer())
      .post(`/customers/${customerId}/contacts`)
      .send({
        name: 'Jordan Smith',
        email: 'jordan@atlas.test',
        phone: '+49 30 99887766',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.customerId).toBe(customerId);
    expect(createResponse.body.name).toBe('Jordan Smith');

    const listResponse = await request(app.getHttpServer()).get(
      `/customers/${customerId}/contacts`,
    );
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const detailResponse = await request(app.getHttpServer()).get('/contacts/1');
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.email).toBe('jordan@atlas.test');

    const updateResponse = await request(app.getHttpServer()).patch('/contacts/1').send({
      name: 'Jordan A. Smith',
      phone: '+49 30 99990000',
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Jordan A. Smith');
    expect(updateResponse.body.phone).toBe('+49 30 99990000');
  });

  it('rejects invalid input and returns 404 for missing resources', async () => {
    const missingCustomer = await request(app.getHttpServer())
      .post('/customers/999/contacts')
      .send({
        name: 'Missing Customer Contact',
      });
    expect(missingCustomer.status).toBe(404);

    const invalidCreate = await request(app.getHttpServer())
      .post('/customers/1/contacts')
      .send({
        name: '',
        email: 'not-an-email',
      });
    expect(invalidCreate.status).toBe(400);

    const missingContact = await request(app.getHttpServer()).get('/contacts/999');
    expect(missingContact.status).toBe(404);
  });
});
