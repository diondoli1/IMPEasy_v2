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

type ItemRecord = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type QuoteRecord = {
  id: number;
  customerId: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type QuoteLineRecord = {
  id: number;
  quoteId: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private customers: CustomerRecord[] = [];
  private items: ItemRecord[] = [];
  private quotes: QuoteRecord[] = [];
  private quoteLines: QuoteLineRecord[] = [];
  private nextCustomerId = 1;
  private nextItemId = 1;
  private nextQuoteId = 1;
  private nextQuoteLineId = 1;

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

  quote = {
    findMany: async (): Promise<QuoteRecord[]> => [...this.quotes],
    findUnique: async ({ where }: { where: { id: number } }): Promise<QuoteRecord | null> =>
      this.quotes.find((quote) => quote.id === where.id) ?? null,
    create: async ({
      data,
    }: {
      data: {
        customerId: number;
        status: string;
        notes: string | null;
      };
    }): Promise<QuoteRecord> => {
      const now = new Date();
      const created: QuoteRecord = {
        id: this.nextQuoteId++,
        customerId: data.customerId,
        status: data.status,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };

      this.quotes.push(created);
      return created;
    },
  };

  quoteLine = {
    findMany: async ({ where }: { where: { quoteId: number } }): Promise<QuoteLineRecord[]> =>
      this.quoteLines.filter((line) => line.quoteId === where.quoteId),
    create: async ({
      data,
    }: {
      data: {
        quoteId: number;
        itemId: number;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      };
    }): Promise<QuoteLineRecord> => {
      const now = new Date();
      const created: QuoteLineRecord = {
        id: this.nextQuoteLineId++,
        quoteId: data.quoteId,
        itemId: data.itemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        lineTotal: data.lineTotal,
        createdAt: now,
        updatedAt: now,
      };

      this.quoteLines.push(created);
      return created;
    },
  };
}

describe('QuoteLinesController (e2e)', () => {
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

  it('adds and lists quote lines for a quote', async () => {
    const customerResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Apex Manufacturing',
      email: 'ops@apex.test',
      phone: '+1 555 111 2233',
    });

    const itemResponse = await request(app.getHttpServer()).post('/items').send({
      name: 'Aluminum Plate 10mm',
      description: 'Raw stock',
    });

    const quoteResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId: customerResponse.body.id,
      notes: 'RFQ with line item',
    });

    const createLineResponse = await request(app.getHttpServer())
      .post(`/quotes/${quoteResponse.body.id}/lines`)
      .send({
        itemId: itemResponse.body.id,
        quantity: 5,
        unitPrice: 12.5,
      });

    expect(createLineResponse.status).toBe(201);
    expect(createLineResponse.body.lineTotal).toBe(62.5);

    const listResponse = await request(app.getHttpServer()).get(
      `/quotes/${quoteResponse.body.id}/lines`,
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].itemId).toBe(itemResponse.body.id);
  });

  it('rejects invalid input and returns 404 for missing resources', async () => {
    const invalidPayload = await request(app.getHttpServer()).post('/quotes/1/lines').send({
      itemId: 0,
      quantity: 0,
      unitPrice: -1,
    });

    expect(invalidPayload.status).toBe(400);

    const missingQuote = await request(app.getHttpServer()).post('/quotes/999/lines').send({
      itemId: 1,
      quantity: 1,
      unitPrice: 10,
    });

    expect(missingQuote.status).toBe(404);
  });
});
