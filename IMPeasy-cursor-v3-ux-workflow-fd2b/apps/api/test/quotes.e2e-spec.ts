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

type SalesOrderRecord = {
  id: number;
  quoteId: number;
  customerId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type SalesOrderLineRecord = {
  id: number;
  salesOrderId: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private customers: CustomerRecord[] = [];
  private quotes: QuoteRecord[] = [];
  private quoteLines: QuoteLineRecord[] = [];
  private salesOrders: SalesOrderRecord[] = [];
  private salesOrderLines: SalesOrderLineRecord[] = [];
  private nextCustomerId = 1;
  private nextQuoteId = 1;
  private nextQuoteLineId = 1;
  private nextSalesOrderId = 1;
  private nextSalesOrderLineId = 1;

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
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: {
        status?: string;
      };
    }): Promise<QuoteRecord> => {
      const index = this.quotes.findIndex((quote) => quote.id === where.id);
      const found = this.quotes[index];
      const updated: QuoteRecord = {
        ...found,
        status: data.status ?? found.status,
        updatedAt: new Date(),
      };

      this.quotes[index] = updated;
      return updated;
    },
  };

  quoteLine = {
    findMany: async ({
      where,
    }: {
      where: { quoteId: number };
      orderBy?: { id: 'asc' | 'desc' };
    }): Promise<QuoteLineRecord[]> =>
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

  salesOrder = {
    findUnique: async ({
      where,
    }: {
      where: { quoteId: number };
    }): Promise<SalesOrderRecord | null> =>
      this.salesOrders.find((salesOrder) => salesOrder.quoteId === where.quoteId) ?? null,
    create: async ({
      data,
    }: {
      data: {
        quoteId: number;
        customerId: number;
        status: string;
        salesOrderLines?: {
          create: Array<{
            itemId: number;
            quantity: number;
            unitPrice: number;
            lineTotal: number;
          }>;
        };
      };
    }): Promise<SalesOrderRecord> => {
      const now = new Date();
      const created: SalesOrderRecord = {
        id: this.nextSalesOrderId++,
        quoteId: data.quoteId,
        customerId: data.customerId,
        status: data.status,
        createdAt: now,
        updatedAt: now,
      };

      this.salesOrders.push(created);

      for (const line of data.salesOrderLines?.create ?? []) {
        this.salesOrderLines.push({
          id: this.nextSalesOrderLineId++,
          salesOrderId: created.id,
          itemId: line.itemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          createdAt: now,
          updatedAt: now,
        });
      }

      return created;
    },
  };
}

describe('QuotesController (e2e)', () => {
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

  it('creates, lists, and views a quote', async () => {
    const customerResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Apex Manufacturing',
      email: 'ops@apex.test',
      phone: '+1 555 111 2233',
    });

    const customerId = customerResponse.body.id as number;

    const createResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId,
      notes: 'Initial RFQ quote',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.customerId).toBe(customerId);
    expect(createResponse.body.status).toBe('draft');

    const listResponse = await request(app.getHttpServer()).get('/quotes');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const detailResponse = await request(app.getHttpServer()).get('/quotes/1');
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.notes).toBe('Initial RFQ quote');
  });

  it('rejects invalid input and returns 404 for missing resources', async () => {
    const invalidCreate = await request(app.getHttpServer()).post('/quotes').send({
      customerId: 0,
    });

    expect(invalidCreate.status).toBe(400);

    const missingCustomer = await request(app.getHttpServer()).post('/quotes').send({
      customerId: 999,
      notes: 'Should fail',
    });

    expect(missingCustomer.status).toBe(404);

    const missingQuote = await request(app.getHttpServer()).get('/quotes/999');
    expect(missingQuote.status).toBe(404);
  });

  it('allows only configured quote status transitions', async () => {
    const customerResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Apex Manufacturing',
      email: 'ops@apex.test',
      phone: '+1 555 111 2233',
    });

    const createResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId: customerResponse.body.id,
      notes: 'Approval workflow',
    });
    const quoteId = createResponse.body.id as number;

    const sendResponse = await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'sent' });
    expect(sendResponse.status).toBe(200);
    expect(sendResponse.body.status).toBe('sent');

    const approveResponse = await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'approved' });
    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.status).toBe('approved');

    const secondQuoteResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId: customerResponse.body.id,
      notes: 'Second branch',
    });

    const secondQuoteId = secondQuoteResponse.body.id as number;
    await request(app.getHttpServer())
      .patch(`/quotes/${secondQuoteId}/status`)
      .send({ status: 'sent' })
      .expect(200);

    const rejectResponse = await request(app.getHttpServer())
      .patch(`/quotes/${secondQuoteId}/status`)
      .send({ status: 'rejected' });
    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.status).toBe('rejected');
  });

  it('rejects invalid quote status transitions and missing quote updates', async () => {
    const customerResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Apex Manufacturing',
      email: 'ops@apex.test',
      phone: '+1 555 111 2233',
    });

    const createResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId: customerResponse.body.id,
      notes: 'Invalid transitions',
    });
    const quoteId = createResponse.body.id as number;

    const invalidTransition = await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'approved' });
    expect(invalidTransition.status).toBe(400);

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const invalidFromApproved = await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'rejected' });
    expect(invalidFromApproved.status).toBe(400);

    const invalidPayload = await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'draft' });
    expect(invalidPayload.status).toBe(400);

    const missingQuote = await request(app.getHttpServer())
      .patch('/quotes/999/status')
      .send({ status: 'sent' });
    expect(missingQuote.status).toBe(404);
  });

  it('converts an approved quote into a sales order', async () => {
    const customerResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Apex Manufacturing',
      email: 'ops@apex.test',
      phone: '+1 555 111 2233',
    });

    const quoteResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId: customerResponse.body.id,
      notes: 'Convert me',
    });
    const quoteId = quoteResponse.body.id as number;

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${quoteId}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const convertResponse = await request(app.getHttpServer()).post(`/quotes/${quoteId}/convert`);

    expect(convertResponse.status).toBe(201);
    expect(convertResponse.body.quote.id).toBe(quoteId);
    expect(convertResponse.body.quote.status).toBe('converted');
    expect(convertResponse.body.salesOrder.quoteId).toBe(quoteId);
    expect(convertResponse.body.salesOrder.customerId).toBe(customerResponse.body.id);
    expect(convertResponse.body.salesOrder.status).toBe('draft');
  });

  it('rejects invalid conversions and prevents double conversion', async () => {
    const customerResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Apex Manufacturing',
      email: 'ops@apex.test',
      phone: '+1 555 111 2233',
    });

    const draftQuoteResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId: customerResponse.body.id,
      notes: 'Still draft',
    });

    const draftConvert = await request(app.getHttpServer()).post(
      `/quotes/${draftQuoteResponse.body.id}/convert`,
    );
    expect(draftConvert.status).toBe(400);

    const approvedQuoteResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId: customerResponse.body.id,
      notes: 'Approve then convert',
    });
    const approvedQuoteId = approvedQuoteResponse.body.id as number;

    await request(app.getHttpServer())
      .patch(`/quotes/${approvedQuoteId}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${approvedQuoteId}/status`)
      .send({ status: 'approved' })
      .expect(200);

    await request(app.getHttpServer()).post(`/quotes/${approvedQuoteId}/convert`).expect(201);

    const secondConvert = await request(app.getHttpServer()).post(`/quotes/${approvedQuoteId}/convert`);
    expect(secondConvert.status).toBe(400);

    const missingQuote = await request(app.getHttpServer()).post('/quotes/999/convert');
    expect(missingQuote.status).toBe(404);
  });
});
