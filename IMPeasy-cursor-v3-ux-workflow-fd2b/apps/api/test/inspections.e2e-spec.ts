import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type SalesOrderLineRecord = {
  id: number;
  salesOrderId: number;
  itemId: number;
};

type WorkOrderRecord = {
  id: number;
  salesOrderLineId: number;
  routingId: number;
};

type RoutingOperationRecord = {
  id: number;
  name: string;
};

type WorkOrderOperationRecord = {
  id: number;
  workOrderId: number;
  routingOperationId: number;
  sequence: number;
  plannedQuantity: number;
  status: string;
  reworkSourceOperationId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type InspectionRecord = {
  id: number;
  operationId: number;
  status: string;
  notes: string | null;
  passedQuantity: number | null;
  failedQuantity: number | null;
  reworkQuantity: number | null;
  scrappedQuantity: number | null;
  scrapNotes: string | null;
  scrappedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProductionLogRecord = {
  id: number;
  operationId: number;
  quantity: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class PrismaServiceMock {
  private salesOrderLines: SalesOrderLineRecord[] = [
    { id: 1, salesOrderId: 11, itemId: 21 },
    { id: 2, salesOrderId: 12, itemId: 22 },
    { id: 3, salesOrderId: 13, itemId: 23 },
    { id: 4, salesOrderId: 14, itemId: 24 },
  ];
  private workOrders: WorkOrderRecord[] = [
    { id: 1, salesOrderLineId: 1, routingId: 31 },
    { id: 2, salesOrderLineId: 2, routingId: 32 },
    { id: 3, salesOrderLineId: 3, routingId: 33 },
    { id: 4, salesOrderLineId: 4, routingId: 34 },
  ];
  private routingOperations: RoutingOperationRecord[] = [
    { id: 1, name: 'Laser Cutting' },
    { id: 2, name: 'Deburr' },
    { id: 3, name: 'Inspection Prep' },
    { id: 4, name: 'Final Inspection' },
  ];
  private workOrderOperations: WorkOrderOperationRecord[] = [
    {
      id: 1,
      workOrderId: 1,
      routingOperationId: 1,
      sequence: 10,
      plannedQuantity: 50,
      status: 'completed',
      reworkSourceOperationId: null,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      id: 2,
      workOrderId: 2,
      routingOperationId: 2,
      sequence: 20,
      plannedQuantity: 25,
      status: 'running',
      reworkSourceOperationId: null,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      id: 3,
      workOrderId: 3,
      routingOperationId: 3,
      sequence: 30,
      plannedQuantity: 10,
      status: 'completed',
      reworkSourceOperationId: null,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      id: 4,
      workOrderId: 4,
      routingOperationId: 4,
      sequence: 40,
      plannedQuantity: 40,
      status: 'completed',
      reworkSourceOperationId: null,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
  ];
  private productionLogs: ProductionLogRecord[] = [
    {
      id: 1,
      operationId: 1,
      quantity: 30,
      notes: null,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      id: 2,
      operationId: 1,
      quantity: 20,
      notes: null,
      createdAt: new Date('2026-03-10T10:05:00.000Z'),
      updatedAt: new Date('2026-03-10T10:05:00.000Z'),
    },
    {
      id: 3,
      operationId: 2,
      quantity: 10,
      notes: null,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
    {
      id: 4,
      operationId: 4,
      quantity: 40,
      notes: null,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    },
  ];
  private inspections: InspectionRecord[] = [];
  private nextInspectionId = 1;
  private nextWorkOrderOperationId = 5;

  workOrderOperation = {
    findUnique: async ({
      where,
      include,
    }: {
      where: { id?: number; reworkSourceOperationId?: number };
      include?: {
        workOrder?: {
          include?: {
            salesOrderLine?: boolean;
          };
        };
        routingOperation?: boolean;
      };
    }): Promise<
      | (WorkOrderOperationRecord & {
          workOrder?: WorkOrderRecord & {
            salesOrderLine?: SalesOrderLineRecord;
          };
          routingOperation?: RoutingOperationRecord;
        })
      | null
    > => {
      const operation =
        this.workOrderOperations.find((entry) =>
          where.id !== undefined
            ? entry.id === where.id
            : entry.reworkSourceOperationId === where.reworkSourceOperationId,
        ) ?? null;

      if (!operation) {
        return null;
      }

      if (!include) {
        return operation;
      }

      const workOrder = this.workOrders.find((entry) => entry.id === operation.workOrderId);
      const salesOrderLine = workOrder
        ? this.salesOrderLines.find((entry) => entry.id === workOrder.salesOrderLineId)
        : undefined;
      const routingOperation = this.routingOperations.find(
        (entry) => entry.id === operation.routingOperationId,
      );

      return {
        ...operation,
        workOrder: workOrder
          ? {
              ...workOrder,
              salesOrderLine,
            }
          : undefined,
        routingOperation,
      };
    },
    create: async ({
      data,
    }: {
      data: {
        workOrderId: number;
        routingOperationId: number;
        sequence: number;
        plannedQuantity: number;
        status: string;
        reworkSourceOperationId?: number | null;
      };
    }): Promise<WorkOrderOperationRecord> => {
      const now = new Date();
      const created: WorkOrderOperationRecord = {
        id: this.nextWorkOrderOperationId++,
        workOrderId: data.workOrderId,
        routingOperationId: data.routingOperationId,
        sequence: data.sequence,
        plannedQuantity: data.plannedQuantity,
        status: data.status,
        reworkSourceOperationId: data.reworkSourceOperationId ?? null,
        createdAt: now,
        updatedAt: now,
      };

      this.workOrderOperations.push(created);
      return created;
    },
  };

  inspection = {
    findUnique: async ({
      where,
    }: {
      where: { id?: number; operationId?: number };
    }): Promise<InspectionRecord | null> => {
      if (where.id !== undefined) {
        return this.inspections.find((inspection) => inspection.id === where.id) ?? null;
      }

      return (
        this.inspections.find((inspection) => inspection.operationId === where.operationId) ?? null
      );
    },
    create: async ({
      data,
    }: {
      data: {
        operationId: number;
        status: string;
        notes: string | null;
        passedQuantity?: number | null;
        failedQuantity?: number | null;
        reworkQuantity?: number | null;
        scrappedQuantity?: number | null;
        scrapNotes?: string | null;
        scrappedAt?: Date | null;
      };
    }): Promise<InspectionRecord> => {
      const now = new Date();
      const created: InspectionRecord = {
        id: this.nextInspectionId++,
        operationId: data.operationId,
        status: data.status,
        notes: data.notes,
        passedQuantity: data.passedQuantity ?? null,
        failedQuantity: data.failedQuantity ?? null,
        reworkQuantity: data.reworkQuantity ?? null,
        scrappedQuantity: data.scrappedQuantity ?? null,
        scrapNotes: data.scrapNotes ?? null,
        scrappedAt: data.scrappedAt ?? null,
        createdAt: now,
        updatedAt: now,
      };

      this.inspections.push(created);
      return created;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id?: number; operationId?: number };
      data: {
        status?: string;
        notes?: string | null;
        passedQuantity?: number | null;
        failedQuantity?: number | null;
        reworkQuantity?: number | null;
        scrappedQuantity?: number | null;
        scrapNotes?: string | null;
        scrappedAt?: Date | null;
      };
    }): Promise<InspectionRecord> => {
      const inspection = this.inspections.find((entry) =>
        where.id !== undefined ? entry.id === where.id : entry.operationId === where.operationId,
      );

      if (!inspection) {
        throw new Error('Inspection not found');
      }

      if (data.status !== undefined) {
        inspection.status = data.status;
      }

      if (data.notes !== undefined) {
        inspection.notes = data.notes;
      }

      if (data.passedQuantity !== undefined) {
        inspection.passedQuantity = data.passedQuantity;
      }

      if (data.failedQuantity !== undefined) {
        inspection.failedQuantity = data.failedQuantity;
      }

      if (data.reworkQuantity !== undefined) {
        inspection.reworkQuantity = data.reworkQuantity;
      }

      if (data.scrappedQuantity !== undefined) {
        inspection.scrappedQuantity = data.scrappedQuantity;
      }

      if (data.scrapNotes !== undefined) {
        inspection.scrapNotes = data.scrapNotes;
      }

      if (data.scrappedAt !== undefined) {
        inspection.scrappedAt = data.scrappedAt;
      }

      inspection.updatedAt = new Date();
      return inspection;
    },
  };

  productionLog = {
    aggregate: async ({
      where,
    }: {
      where: { operationId: number };
      _sum: { quantity: true };
    }): Promise<{ _sum: { quantity: number | null } }> => {
      const quantity = this.productionLogs
        .filter((entry) => entry.operationId === where.operationId)
        .reduce((sum, entry) => sum + entry.quantity, 0);

      return {
        _sum: {
          quantity: quantity === 0 ? null : quantity,
        },
      };
    },
  };
}

describe('InspectionsController (e2e)', () => {
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

  it('creates and gets an inspection for a completed operation', async () => {
    const createResponse = await request(app.getHttpServer()).post('/operations/1/inspection').send({
      notes: 'First article inspection pending',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.operationId).toBe(1);
    expect(createResponse.body.status).toBe('pending');
    expect(createResponse.body.notes).toBe('First article inspection pending');
    expect(createResponse.body.passedQuantity).toBeNull();
    expect(createResponse.body.failedQuantity).toBeNull();
    expect(createResponse.body.reworkQuantity).toBeNull();
    expect(createResponse.body.scrappedQuantity).toBeNull();
    expect(createResponse.body.scrapNotes).toBeNull();
    expect(createResponse.body.scrappedAt).toBeNull();
    expect(createResponse.body.reworkOperationId).toBeNull();
    expect(createResponse.body.reworkOperationStatus).toBeNull();
    expect(createResponse.body.reworkCreatedAt).toBeNull();

    const getResponse = await request(app.getHttpServer()).get('/operations/1/inspection');

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(createResponse.body.id);
    expect(getResponse.body.status).toBe('pending');
    expect(getResponse.body.reworkOperationId).toBeNull();
  });

  it('records passed and failed inspection results with quantity totals', async () => {
    const createPassedInspection = await request(app.getHttpServer())
      .post('/operations/1/inspection')
      .send({
        notes: 'Pending pass review',
      });
    expect(createPassedInspection.status).toBe(201);

    const passedResult = await request(app.getHttpServer())
      .patch('/operations/1/inspection/result')
      .send({
        status: 'passed',
        passedQuantity: 50,
        failedQuantity: 0,
        reworkQuantity: 0,
        notes: 'Accepted',
      });

    expect(passedResult.status).toBe(200);
    expect(passedResult.body.status).toBe('passed');
    expect(passedResult.body.passedQuantity).toBe(50);
    expect(passedResult.body.failedQuantity).toBe(0);
    expect(passedResult.body.reworkQuantity).toBe(0);
    expect(passedResult.body.notes).toBe('Accepted');

    const createFailedInspection = await request(app.getHttpServer())
      .post('/operations/4/inspection')
      .send({
        notes: 'Pending final review',
      });
    expect(createFailedInspection.status).toBe(201);

    const failedResult = await request(app.getHttpServer())
      .patch('/operations/4/inspection/result')
      .send({
        status: 'failed',
        passedQuantity: 25,
        failedQuantity: 10,
        reworkQuantity: 5,
        notes: 'Cosmetic defects and rework required',
      });

    expect(failedResult.status).toBe(200);
    expect(failedResult.body.status).toBe('failed');
    expect(failedResult.body.passedQuantity).toBe(25);
    expect(failedResult.body.failedQuantity).toBe(10);
    expect(failedResult.body.reworkQuantity).toBe(5);
  });

  it('creates a traceable rework operation from failed inspections with rework quantity', async () => {
    const createResponse = await request(app.getHttpServer()).post('/operations/4/inspection').send({
      notes: 'Awaiting QC',
    });
    expect(createResponse.status).toBe(201);

    const failedResult = await request(app.getHttpServer())
      .patch('/operations/4/inspection/result')
      .send({
        status: 'failed',
        passedQuantity: 30,
        failedQuantity: 5,
        reworkQuantity: 5,
        notes: 'Failed with rework lot',
      });
    expect(failedResult.status).toBe(200);

    const reworkResponse = await request(app.getHttpServer())
      .post('/operations/4/inspection/rework')
      .send();

    expect(reworkResponse.status).toBe(201);
    expect(reworkResponse.body.status).toBe('rework_required');
    expect(reworkResponse.body.reworkQuantity).toBe(5);
    expect(reworkResponse.body.reworkOperationId).toBeTruthy();
    expect(reworkResponse.body.reworkOperationStatus).toBe('ready');
    expect(reworkResponse.body.reworkOperationSequence).toBe(40);
    expect(reworkResponse.body.reworkOperationPlannedQuantity).toBe(5);
    expect(reworkResponse.body.reworkCreatedAt).not.toBeNull();

    const reworkOperationId = reworkResponse.body.reworkOperationId as number;
    const reworkOperationResponse = await request(app.getHttpServer()).get(
      `/operations/${reworkOperationId}`,
    );

    expect(reworkOperationResponse.status).toBe(200);
    expect(reworkOperationResponse.body.workOrderId).toBe(4);
    expect(reworkOperationResponse.body.routingOperationId).toBe(4);
    expect(reworkOperationResponse.body.plannedQuantity).toBe(5);
    expect(reworkOperationResponse.body.status).toBe('ready');
    expect(reworkOperationResponse.body.reworkSourceOperationId).toBe(4);
  });

  it('records scrap handling for failed and rework_required inspections', async () => {
    const createFailedInspection = await request(app.getHttpServer())
      .post('/operations/1/inspection')
      .send({
        notes: 'Pending QC',
      });
    expect(createFailedInspection.status).toBe(201);

    const failedResult = await request(app.getHttpServer())
      .patch('/operations/1/inspection/result')
      .send({
        status: 'failed',
        passedQuantity: 40,
        failedQuantity: 10,
        reworkQuantity: 0,
        notes: 'Ten units failed',
      });
    expect(failedResult.status).toBe(200);

    const failedScrap = await request(app.getHttpServer())
      .post('/operations/1/inspection/scrap')
      .send({
        notes: 'Scrapped after final QC review',
      });

    expect(failedScrap.status).toBe(201);
    expect(failedScrap.body.status).toBe('failed');
    expect(failedScrap.body.scrappedQuantity).toBe(10);
    expect(failedScrap.body.scrapNotes).toBe('Scrapped after final QC review');
    expect(failedScrap.body.scrappedAt).not.toBeNull();
    expect(failedScrap.body.reworkOperationId).toBeNull();

    const createReworkInspection = await request(app.getHttpServer())
      .post('/operations/4/inspection')
      .send({
        notes: 'Pending mixed disposition',
      });
    expect(createReworkInspection.status).toBe(201);

    const reworkResult = await request(app.getHttpServer())
      .patch('/operations/4/inspection/result')
      .send({
        status: 'failed',
        passedQuantity: 30,
        failedQuantity: 5,
        reworkQuantity: 5,
        notes: 'Mixed failure result',
      });
    expect(reworkResult.status).toBe(200);

    const markRework = await request(app.getHttpServer())
      .post('/operations/4/inspection/rework')
      .send();
    expect(markRework.status).toBe(201);

    const reworkScrap = await request(app.getHttpServer())
      .post('/operations/4/inspection/scrap')
      .send({
        notes: 'Five units scrapped, five rework',
      });

    expect(reworkScrap.status).toBe(201);
    expect(reworkScrap.body.status).toBe('rework_required');
    expect(reworkScrap.body.scrappedQuantity).toBe(5);
    expect(reworkScrap.body.scrapNotes).toBe('Five units scrapped, five rework');
    expect(reworkScrap.body.reworkOperationId).toBeTruthy();
  });

  it('rejects invalid creation cases and missing records', async () => {
    const missingOperationCreate = await request(app.getHttpServer())
      .post('/operations/999/inspection')
      .send({
        notes: 'Missing operation',
      });
    expect(missingOperationCreate.status).toBe(404);

    const missingInspectionGet = await request(app.getHttpServer()).get('/operations/1/inspection');
    expect(missingInspectionGet.status).toBe(404);

    const invalidStatusCreate = await request(app.getHttpServer())
      .post('/operations/2/inspection')
      .send({
        notes: 'Operation still running',
      });
    expect(invalidStatusCreate.status).toBe(400);

    const firstCreate = await request(app.getHttpServer()).post('/operations/1/inspection').send({
      notes: 'First article inspection pending',
    });
    expect(firstCreate.status).toBe(201);

    const duplicateCreate = await request(app.getHttpServer()).post('/operations/1/inspection').send({
      notes: 'Duplicate',
    });
    expect(duplicateCreate.status).toBe(400);
  });

  it('rejects invalid inspection result and rework transitions', async () => {
    const missingInspectionResult = await request(app.getHttpServer())
      .patch('/operations/1/inspection/result')
      .send({
        status: 'passed',
        passedQuantity: 50,
        failedQuantity: 0,
        reworkQuantity: 0,
      });
    expect(missingInspectionResult.status).toBe(404);

    const createZeroProductionInspection = await request(app.getHttpServer())
      .post('/operations/3/inspection')
      .send({
        notes: 'No logs yet',
      });
    expect(createZeroProductionInspection.status).toBe(201);

    const zeroProductionResult = await request(app.getHttpServer())
      .patch('/operations/3/inspection/result')
      .send({
        status: 'passed',
        passedQuantity: 10,
        failedQuantity: 0,
        reworkQuantity: 0,
      });
    expect(zeroProductionResult.status).toBe(400);

    const createInspection = await request(app.getHttpServer()).post('/operations/1/inspection').send({
      notes: 'Awaiting QC',
    });
    expect(createInspection.status).toBe(201);

    const invalidTotalResult = await request(app.getHttpServer())
      .patch('/operations/1/inspection/result')
      .send({
        status: 'failed',
        passedQuantity: 30,
        failedQuantity: 10,
        reworkQuantity: 5,
      });
    expect(invalidTotalResult.status).toBe(400);

    const invalidPassedResult = await request(app.getHttpServer())
      .patch('/operations/1/inspection/result')
      .send({
        status: 'passed',
        passedQuantity: 45,
        failedQuantity: 5,
        reworkQuantity: 0,
      });
    expect(invalidPassedResult.status).toBe(400);

    const missingReworkInspection = await request(app.getHttpServer())
      .post('/operations/4/inspection/rework')
      .send();
    expect(missingReworkInspection.status).toBe(404);

    const failedWithoutRework = await request(app.getHttpServer())
      .post('/operations/4/inspection')
      .send({
        notes: 'QC pending',
      });
    expect(failedWithoutRework.status).toBe(201);

    const failedWithoutReworkResult = await request(app.getHttpServer())
      .patch('/operations/4/inspection/result')
      .send({
        status: 'failed',
        passedQuantity: 35,
        failedQuantity: 5,
        reworkQuantity: 0,
      });
    expect(failedWithoutReworkResult.status).toBe(200);

    const invalidReworkTransition = await request(app.getHttpServer())
      .post('/operations/4/inspection/rework')
      .send();
    expect(invalidReworkTransition.status).toBe(400);

    const passedTransition = await request(app.getHttpServer())
      .patch('/operations/1/inspection/result')
      .send({
        status: 'passed',
        passedQuantity: 50,
        failedQuantity: 0,
        reworkQuantity: 0,
      });
    expect(passedTransition.status).toBe(200);

    const reworkFromPassed = await request(app.getHttpServer())
      .post('/operations/1/inspection/rework')
      .send();
    expect(reworkFromPassed.status).toBe(400);
  });

  it('rejects duplicate rework workflow creation', async () => {
    const createResponse = await request(app.getHttpServer()).post('/operations/4/inspection').send({
      notes: 'Awaiting rework',
    });
    expect(createResponse.status).toBe(201);

    const failedResult = await request(app.getHttpServer())
      .patch('/operations/4/inspection/result')
      .send({
        status: 'failed',
        passedQuantity: 30,
        failedQuantity: 5,
        reworkQuantity: 5,
      });
    expect(failedResult.status).toBe(200);

    const firstRework = await request(app.getHttpServer())
      .post('/operations/4/inspection/rework')
      .send();
    expect(firstRework.status).toBe(201);

    const duplicateRework = await request(app.getHttpServer())
      .post('/operations/4/inspection/rework')
      .send();
    expect(duplicateRework.status).toBe(400);
  });

  it('rejects invalid scrap handling cases', async () => {
    const missingInspectionScrap = await request(app.getHttpServer())
      .post('/operations/1/inspection/scrap')
      .send({
        notes: 'Missing inspection',
      });
    expect(missingInspectionScrap.status).toBe(404);

    const createPassedInspection = await request(app.getHttpServer())
      .post('/operations/1/inspection')
      .send({
        notes: 'Pass path',
      });
    expect(createPassedInspection.status).toBe(201);

    const passedResult = await request(app.getHttpServer())
      .patch('/operations/1/inspection/result')
      .send({
        status: 'passed',
        passedQuantity: 50,
        failedQuantity: 0,
        reworkQuantity: 0,
      });
    expect(passedResult.status).toBe(200);

    const scrapFromPassed = await request(app.getHttpServer())
      .post('/operations/1/inspection/scrap')
      .send({
        notes: 'Should fail',
      });
    expect(scrapFromPassed.status).toBe(400);

    const createReworkOnlyInspection = await request(app.getHttpServer())
      .post('/operations/4/inspection')
      .send({
        notes: 'Rework only',
      });
    expect(createReworkOnlyInspection.status).toBe(201);

    const reworkOnlyResult = await request(app.getHttpServer())
      .patch('/operations/4/inspection/result')
      .send({
        status: 'failed',
        passedQuantity: 35,
        failedQuantity: 0,
        reworkQuantity: 5,
      });
    expect(reworkOnlyResult.status).toBe(200);

    const markRework = await request(app.getHttpServer())
      .post('/operations/4/inspection/rework')
      .send();
    expect(markRework.status).toBe(201);

    const scrapWithoutFailedQuantity = await request(app.getHttpServer())
      .post('/operations/4/inspection/scrap')
      .send({
        notes: 'No failed quantity to scrap',
      });
    expect(scrapWithoutFailedQuantity.status).toBe(400);

    const createFailedInspection = await request(app.getHttpServer())
      .post('/operations/3/inspection')
      .send({
        notes: 'No production path',
      });
    expect(createFailedInspection.status).toBe(201);

    const zeroProductionResult = await request(app.getHttpServer())
      .patch('/operations/3/inspection/result')
      .send({
        status: 'passed',
        passedQuantity: 10,
        failedQuantity: 0,
        reworkQuantity: 0,
      });
    expect(zeroProductionResult.status).toBe(400);

    const createAnotherFailedInspection = await request(app.getHttpServer())
      .post('/operations/1/inspection')
      .send({
        notes: 'Duplicate scrap check',
      });
    expect(createAnotherFailedInspection.status).toBe(400);
  });
});
