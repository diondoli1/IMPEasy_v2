import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type InspectionSeed = {
  status: string;
  passedQuantity: number | null;
  failedQuantity: number | null;
  reworkQuantity: number | null;
  scrappedQuantity: number | null;
};

type ProductionLogSeed = {
  quantity: number;
};

type WorkOrderOperationSeed = {
  id: number;
  sequence: number;
  status: string;
  inspection: InspectionSeed | null;
  productionLogs?: ProductionLogSeed[];
};

type WorkOrderSeed = {
  id: number;
  workOrderOperations: WorkOrderOperationSeed[];
};

type SalesOrderLineSeed = {
  id: number;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  workOrder: WorkOrderSeed | null;
};

type InvoiceLineSeed = {
  id: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ShipmentLineSeed = {
  id: number;
  quantity: number;
  salesOrderLine: {
    unitPrice: number;
  };
};

type ShipmentSeed = {
  id: number;
  status: string;
  invoice: {
    status: string;
    invoiceLines?: InvoiceLineSeed[];
  } | null;
  shipmentLines?: ShipmentLineSeed[];
};

type SalesOrderSeed = {
  id: number;
  quoteId: number;
  customerId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    name: string;
  };
  salesOrderLines: SalesOrderLineSeed[];
  shipments: ShipmentSeed[];
};

type ProductionDashboardWorkOrderSeed = {
  id: number;
  salesOrderLineId: number;
  quantity: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  salesOrderLine: {
    salesOrderId: number;
    itemId: number;
    item: {
      name: string;
    };
    salesOrder: {
      customerId: number;
      customer: {
        name: string;
      };
    };
  };
  workOrderOperations: Array<
    Omit<WorkOrderOperationSeed, 'productionLogs'> & {
      productionLogs: ProductionLogSeed[];
    }
  >;
};

type ReportingSeedInput = {
  salesOrders?: SalesOrderSeed[];
  workOrders?: ProductionDashboardWorkOrderSeed[];
  inventoryItems?: InventorySummaryInventoryItemSeed[];
};

type PurchaseOrderLineSeed = {
  id: number;
  purchaseOrderId: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: Date;
  updatedAt: Date;
};

type InventoryTransactionSeed = {
  id: number;
  purchaseOrderLineId: number | null;
  transactionType: string;
  quantity: number;
};

type InventorySummaryInventoryItemSeed = {
  id: number;
  itemId: number;
  quantityOnHand: number;
  createdAt: Date;
  updatedAt: Date;
  item: {
    name: string;
    purchaseOrderLines: PurchaseOrderLineSeed[];
  };
  inventoryTransactions: InventoryTransactionSeed[];
};

class PrismaServiceMock {
  constructor(
    private readonly salesOrders: SalesOrderSeed[],
    private readonly workOrders: ProductionDashboardWorkOrderSeed[],
    private readonly inventoryItems: InventorySummaryInventoryItemSeed[],
  ) {}

  salesOrder = {
    findMany: async (): Promise<SalesOrderSeed[]> => [...this.salesOrders],
  };

  workOrder = {
    findMany: async (): Promise<ProductionDashboardWorkOrderSeed[]> => [...this.workOrders],
  };

  inventoryItem = {
    findMany: async (): Promise<InventorySummaryInventoryItemSeed[]> => [...this.inventoryItems],
  };
}

async function createApp({
  salesOrders = [],
  workOrders = [],
  inventoryItems = [],
}: ReportingSeedInput = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(new PrismaServiceMock(salesOrders, workOrders, inventoryItems))
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

describe('ReportingController (e2e)', () => {
  it('returns dashboard summary counts and downstream metrics from persisted workflow data', async () => {
    const app = await createApp({
      salesOrders: [
        {
          id: 30,
          quoteId: 12,
          customerId: 3,
          status: 'invoiced',
          createdAt: new Date('2026-03-08T09:00:00.000Z'),
          updatedAt: new Date('2026-03-10T10:00:00.000Z'),
          customer: {
            name: 'Gamma Aerospace',
          },
          salesOrderLines: [
            {
              id: 301,
              quantity: 8,
              workOrder: {
                id: 401,
                workOrderOperations: [
                  {
                    id: 501,
                    sequence: 10,
                    status: 'completed',
                    inspection: {
                      status: 'passed',
                      passedQuantity: 8,
                      failedQuantity: 0,
                      reworkQuantity: 0,
                      scrappedQuantity: 0,
                    },
                  },
                  {
                    id: 502,
                    sequence: 20,
                    status: 'completed',
                    inspection: {
                      status: 'passed',
                      passedQuantity: 8,
                      failedQuantity: 0,
                      reworkQuantity: 0,
                      scrappedQuantity: 0,
                    },
                  },
                ],
              },
            },
          ],
          shipments: [
            {
              id: 601,
              status: 'packed',
              invoice: null,
            },
            {
              id: 602,
              status: 'delivered',
              invoice: {
                status: 'paid',
              },
            },
          ],
        },
        {
          id: 20,
          quoteId: 11,
          customerId: 2,
          status: 'released',
          createdAt: new Date('2026-03-09T09:00:00.000Z'),
          updatedAt: new Date('2026-03-10T08:00:00.000Z'),
          customer: {
            name: 'Bravo Fabrication',
          },
          salesOrderLines: [
            {
              id: 201,
              quantity: 10,
              workOrder: {
                id: 301,
                workOrderOperations: [
                  {
                    id: 401,
                    sequence: 10,
                    status: 'completed',
                    inspection: null,
                  },
                  {
                    id: 402,
                    sequence: 20,
                    status: 'running',
                    inspection: null,
                  },
                ],
              },
            },
            {
              id: 202,
              quantity: 5,
              workOrder: null,
            },
          ],
          shipments: [],
        },
        {
          id: 10,
          quoteId: 10,
          customerId: 1,
          status: 'draft',
          createdAt: new Date('2026-03-10T07:00:00.000Z'),
          updatedAt: new Date('2026-03-10T07:30:00.000Z'),
          customer: {
            name: 'Acme Components',
          },
          salesOrderLines: [
            {
              id: 101,
              quantity: 4,
              workOrder: null,
            },
          ],
          shipments: [],
        },
      ],
    });

    try {
      const response = await request(app.getHttpServer()).get('/reporting/order-status-dashboard');

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalOrders: 3,
        draftCount: 1,
        confirmedCount: 0,
        releasedCount: 1,
        inProductionCount: 0,
        shippedCount: 0,
        invoicedCount: 1,
        closedCount: 0,
      });

      const invoicedOrder = response.body.orders.find(
        (order: { salesOrderId: number }) => order.salesOrderId === 30,
      );
      expect(invoicedOrder).toEqual(
        expect.objectContaining({
          salesOrderId: 30,
          quoteId: 12,
          customerId: 3,
          customerName: 'Gamma Aerospace',
          salesOrderStatus: 'invoiced',
          lineCount: 1,
          orderedQuantity: 8,
          workOrdersGenerated: 1,
          workOrdersExpected: 1,
          openOperationCount: 0,
          completedOperationCount: 2,
          pendingInspectionCount: 0,
          qualityClearedQuantity: 8,
          shipmentCounts: {
            draft: 0,
            packed: 1,
            shipped: 0,
            delivered: 1,
          },
          invoiceCounts: {
            issued: 0,
            paid: 1,
          },
        }),
      );

      const releasedOrder = response.body.orders.find(
        (order: { salesOrderId: number }) => order.salesOrderId === 20,
      );
      expect(releasedOrder).toEqual(
        expect.objectContaining({
          salesOrderId: 20,
          customerName: 'Bravo Fabrication',
          salesOrderStatus: 'released',
          lineCount: 2,
          orderedQuantity: 15,
          workOrdersGenerated: 1,
          workOrdersExpected: 2,
          openOperationCount: 1,
          completedOperationCount: 1,
          pendingInspectionCount: 1,
          qualityClearedQuantity: 0,
          shipmentCounts: {
            draft: 0,
            packed: 0,
            shipped: 0,
            delivered: 0,
          },
          invoiceCounts: {
            issued: 0,
            paid: 0,
          },
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('returns zero-valued downstream metrics when an order has no operational records yet', async () => {
    const app = await createApp({
      salesOrders: [
        {
          id: 10,
          quoteId: 10,
          customerId: 1,
          status: 'draft',
          createdAt: new Date('2026-03-10T07:00:00.000Z'),
          updatedAt: new Date('2026-03-10T07:30:00.000Z'),
          customer: {
            name: 'Acme Components',
          },
          salesOrderLines: [
            {
              id: 101,
              quantity: 4,
              workOrder: null,
            },
            {
              id: 102,
              quantity: 6,
              workOrder: null,
            },
          ],
          shipments: [],
        },
      ],
    });

    try {
      const response = await request(app.getHttpServer()).get('/reporting/order-status-dashboard');

      expect(response.status).toBe(200);
      expect(response.body.summary.totalOrders).toBe(1);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0]).toEqual(
        expect.objectContaining({
          salesOrderId: 10,
          salesOrderStatus: 'draft',
          lineCount: 2,
          orderedQuantity: 10,
          workOrdersGenerated: 0,
          workOrdersExpected: 2,
          openOperationCount: 0,
          completedOperationCount: 0,
          pendingInspectionCount: 0,
          qualityClearedQuantity: 0,
          shipmentCounts: {
            draft: 0,
            packed: 0,
            shipped: 0,
            delivered: 0,
          },
          invoiceCounts: {
            issued: 0,
            paid: 0,
          },
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('returns sales report summary and row metrics from persisted sales, shipping, and invoicing data', async () => {
    const app = await createApp({
      salesOrders: [
        {
          id: 52,
          quoteId: 17,
          customerId: 8,
          status: 'invoiced',
          createdAt: new Date('2026-03-09T06:00:00.000Z'),
          updatedAt: new Date('2026-03-10T07:00:00.000Z'),
          customer: {
            name: 'Bravo Fabrication',
          },
          salesOrderLines: [
            {
              id: 1001,
              quantity: 10,
              unitPrice: 12,
              lineTotal: 120,
              workOrder: null,
            },
            {
              id: 1002,
              quantity: 5,
              unitPrice: 20,
              lineTotal: 100,
              workOrder: null,
            },
          ],
          shipments: [
            {
              id: 2001,
              status: 'delivered',
              shipmentLines: [
                {
                  id: 3001,
                  quantity: 10,
                  salesOrderLine: {
                    unitPrice: 12,
                  },
                },
              ],
              invoice: {
                status: 'paid',
                invoiceLines: [
                  {
                    id: 4001,
                    quantity: 10,
                    unitPrice: 12,
                    lineTotal: 120,
                  },
                ],
              },
            },
            {
              id: 2002,
              status: 'shipped',
              shipmentLines: [
                {
                  id: 3002,
                  quantity: 2,
                  salesOrderLine: {
                    unitPrice: 20,
                  },
                },
              ],
              invoice: {
                status: 'issued',
                invoiceLines: [
                  {
                    id: 4002,
                    quantity: 2,
                    unitPrice: 20,
                    lineTotal: 40,
                  },
                ],
              },
            },
            {
              id: 2003,
              status: 'packed',
              shipmentLines: [
                {
                  id: 3003,
                  quantity: 1,
                  salesOrderLine: {
                    unitPrice: 20,
                  },
                },
              ],
              invoice: null,
            },
          ],
        },
        {
          id: 51,
          quoteId: 16,
          customerId: 7,
          status: 'released',
          createdAt: new Date('2026-03-09T04:00:00.000Z'),
          updatedAt: new Date('2026-03-10T05:30:00.000Z'),
          customer: {
            name: 'Acme Components',
          },
          salesOrderLines: [
            {
              id: 1003,
              quantity: 4,
              unitPrice: 15,
              lineTotal: 60,
              workOrder: null,
            },
          ],
          shipments: [],
        },
      ],
    });

    try {
      const response = await request(app.getHttpServer()).get('/reporting/sales-report');

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalSalesOrders: 2,
        totalOrderedQuantity: 19,
        totalOrderedAmount: 280,
        totalShippedQuantity: 12,
        totalShippedAmount: 160,
        totalInvoiceIssuedAmount: 40,
        totalInvoicePaidAmount: 120,
        totalOutstandingInvoiceAmount: 40,
      });

      const invoicedOrder = response.body.orders.find(
        (order: { salesOrderId: number }) => order.salesOrderId === 52,
      );
      expect(invoicedOrder).toEqual(
        expect.objectContaining({
          salesOrderId: 52,
          quoteId: 17,
          customerId: 8,
          customerName: 'Bravo Fabrication',
          salesOrderStatus: 'invoiced',
          orderedQuantity: 15,
          orderedAmount: 220,
          shippedQuantity: 12,
          shippedAmount: 160,
          invoiceIssuedAmount: 40,
          invoicePaidAmount: 120,
          outstandingInvoiceAmount: 40,
          shipmentCount: 3,
          deliveredShipmentCount: 1,
          invoiceIssuedCount: 1,
          invoicePaidCount: 1,
        }),
      );

      const releasedOrder = response.body.orders.find(
        (order: { salesOrderId: number }) => order.salesOrderId === 51,
      );
      expect(releasedOrder).toEqual(
        expect.objectContaining({
          salesOrderId: 51,
          quoteId: 16,
          customerId: 7,
          customerName: 'Acme Components',
          salesOrderStatus: 'released',
          orderedQuantity: 4,
          orderedAmount: 60,
          shippedQuantity: 0,
          shippedAmount: 0,
          invoiceIssuedAmount: 0,
          invoicePaidAmount: 0,
          outstandingInvoiceAmount: 0,
          shipmentCount: 0,
          deliveredShipmentCount: 0,
          invoiceIssuedCount: 0,
          invoicePaidCount: 0,
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('returns zero-valued sales report summary when no sales orders exist', async () => {
    const app = await createApp({
      salesOrders: [],
    });

    try {
      const response = await request(app.getHttpServer()).get('/reporting/sales-report');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        summary: {
          totalSalesOrders: 0,
          totalOrderedQuantity: 0,
          totalOrderedAmount: 0,
          totalShippedQuantity: 0,
          totalShippedAmount: 0,
          totalInvoiceIssuedAmount: 0,
          totalInvoicePaidAmount: 0,
          totalOutstandingInvoiceAmount: 0,
        },
        orders: [],
      });
    } finally {
      await app.close();
    }
  });

  it('returns production dashboard summary and row metrics from persisted production data', async () => {
    const app = await createApp({
      workOrders: [
        {
          id: 701,
          salesOrderLineId: 301,
          quantity: 20,
          status: 'in_progress',
          createdAt: new Date('2026-03-10T05:00:00.000Z'),
          updatedAt: new Date('2026-03-10T07:00:00.000Z'),
          salesOrderLine: {
            salesOrderId: 41,
            itemId: 1001,
            item: {
              name: 'Gear Housing',
            },
            salesOrder: {
              customerId: 10,
              customer: {
                name: 'Alpha Dynamics',
              },
            },
          },
          workOrderOperations: [
            {
              id: 801,
              sequence: 10,
              status: 'completed',
              inspection: {
                status: 'pending',
                passedQuantity: null,
                failedQuantity: null,
                reworkQuantity: null,
                scrappedQuantity: null,
              },
              productionLogs: [{ quantity: 12 }],
            },
            {
              id: 802,
              sequence: 20,
              status: 'running',
              inspection: null,
              productionLogs: [{ quantity: 5 }],
            },
            {
              id: 803,
              sequence: 30,
              status: 'queued',
              inspection: null,
              productionLogs: [],
            },
          ],
        },
        {
          id: 702,
          salesOrderLineId: 302,
          quantity: 8,
          status: 'completed',
          createdAt: new Date('2026-03-10T03:00:00.000Z'),
          updatedAt: new Date('2026-03-10T06:00:00.000Z'),
          salesOrderLine: {
            salesOrderId: 42,
            itemId: 1002,
            item: {
              name: 'Valve Stem',
            },
            salesOrder: {
              customerId: 11,
              customer: {
                name: 'Bravo Fabrication',
              },
            },
          },
          workOrderOperations: [
            {
              id: 804,
              sequence: 10,
              status: 'completed',
              inspection: {
                status: 'passed',
                passedQuantity: 8,
                failedQuantity: 0,
                reworkQuantity: 0,
                scrappedQuantity: 0,
              },
              productionLogs: [{ quantity: 8 }],
            },
            {
              id: 805,
              sequence: 20,
              status: 'completed',
              inspection: {
                status: 'failed',
                passedQuantity: 3,
                failedQuantity: 3,
                reworkQuantity: 2,
                scrappedQuantity: 1,
              },
              productionLogs: [{ quantity: 8 }],
            },
            {
              id: 806,
              sequence: 20,
              status: 'paused',
              inspection: {
                status: 'rework_required',
                passedQuantity: 1,
                failedQuantity: 1,
                reworkQuantity: 1,
                scrappedQuantity: 0,
              },
              productionLogs: [{ quantity: 2 }],
            },
          ],
        },
      ],
    });

    try {
      const response = await request(app.getHttpServer()).get(
        '/reporting/production-performance-dashboard',
      );

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalWorkOrders: 2,
        plannedWorkOrders: 0,
        releasedWorkOrders: 0,
        inProgressWorkOrders: 1,
        completedWorkOrders: 1,
        closedWorkOrders: 0,
        totalOperations: 6,
        queuedOperations: 1,
        readyOperations: 0,
        runningOperations: 1,
        pausedOperations: 1,
        completedOperations: 3,
        pendingInspections: 1,
        passedInspections: 1,
        failedInspections: 1,
        reworkRequiredInspections: 1,
        totalPlannedQuantity: 28,
        totalRecordedQuantity: 35,
        totalScrappedQuantity: 1,
      });

      const inProgressWorkOrder = response.body.workOrders.find(
        (row: { workOrderId: number }) => row.workOrderId === 701,
      );
      expect(inProgressWorkOrder).toEqual(
        expect.objectContaining({
          workOrderId: 701,
          salesOrderId: 41,
          salesOrderLineId: 301,
          itemId: 1001,
          itemName: 'Gear Housing',
          customerId: 10,
          customerName: 'Alpha Dynamics',
          workOrderStatus: 'in_progress',
          plannedQuantity: 20,
          operationCount: 3,
          queuedOperationCount: 1,
          readyOperationCount: 0,
          runningOperationCount: 1,
          pausedOperationCount: 0,
          completedOperationCount: 1,
          pendingInspectionCount: 1,
          passedInspectionCount: 0,
          failedInspectionCount: 0,
          reworkRequiredInspectionCount: 0,
          recordedProductionQuantity: 17,
          qualityPassedQuantity: 0,
          qualityFailedQuantity: 0,
          qualityReworkQuantity: 0,
          scrappedQuantity: 0,
        }),
      );

      const completedWorkOrder = response.body.workOrders.find(
        (row: { workOrderId: number }) => row.workOrderId === 702,
      );
      expect(completedWorkOrder).toEqual(
        expect.objectContaining({
          workOrderId: 702,
          salesOrderId: 42,
          salesOrderLineId: 302,
          itemId: 1002,
          itemName: 'Valve Stem',
          customerId: 11,
          customerName: 'Bravo Fabrication',
          workOrderStatus: 'completed',
          plannedQuantity: 8,
          operationCount: 3,
          queuedOperationCount: 0,
          readyOperationCount: 0,
          runningOperationCount: 0,
          pausedOperationCount: 1,
          completedOperationCount: 2,
          pendingInspectionCount: 0,
          passedInspectionCount: 1,
          failedInspectionCount: 1,
          reworkRequiredInspectionCount: 1,
          recordedProductionQuantity: 18,
          qualityPassedQuantity: 12,
          qualityFailedQuantity: 4,
          qualityReworkQuantity: 3,
          scrappedQuantity: 1,
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('returns zero-valued production summary when no work orders exist', async () => {
    const app = await createApp({
      workOrders: [],
    });

    try {
      const response = await request(app.getHttpServer()).get(
        '/reporting/production-performance-dashboard',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        summary: {
          totalWorkOrders: 0,
          plannedWorkOrders: 0,
          releasedWorkOrders: 0,
          inProgressWorkOrders: 0,
          completedWorkOrders: 0,
          closedWorkOrders: 0,
          totalOperations: 0,
          queuedOperations: 0,
          readyOperations: 0,
          runningOperations: 0,
          pausedOperations: 0,
          completedOperations: 0,
          pendingInspections: 0,
          passedInspections: 0,
          failedInspections: 0,
          reworkRequiredInspections: 0,
          totalPlannedQuantity: 0,
          totalRecordedQuantity: 0,
          totalScrappedQuantity: 0,
        },
        workOrders: [],
      });
    } finally {
      await app.close();
    }
  });

  it('returns inventory summary totals and item rows from persisted inventory and purchasing data', async () => {
    const app = await createApp({
      inventoryItems: [
        {
          id: 901,
          itemId: 1001,
          quantityOnHand: 40,
          createdAt: new Date('2026-03-09T09:00:00.000Z'),
          updatedAt: new Date('2026-03-10T09:15:00.000Z'),
          item: {
            name: 'Alloy Plate',
            purchaseOrderLines: [
              {
                id: 7001,
                purchaseOrderId: 501,
                itemId: 1001,
                quantity: 30,
                unitPrice: 12,
                lineTotal: 360,
                createdAt: new Date('2026-03-08T09:00:00.000Z'),
                updatedAt: new Date('2026-03-08T09:00:00.000Z'),
              },
              {
                id: 7002,
                purchaseOrderId: 502,
                itemId: 1001,
                quantity: 15,
                unitPrice: 12,
                lineTotal: 180,
                createdAt: new Date('2026-03-09T11:00:00.000Z'),
                updatedAt: new Date('2026-03-09T11:00:00.000Z'),
              },
            ],
          },
          inventoryTransactions: [
            {
              id: 8001,
              purchaseOrderLineId: 7001,
              transactionType: 'receive',
              quantity: 20,
            },
            {
              id: 8002,
              purchaseOrderLineId: 7001,
              transactionType: 'receive',
              quantity: 10,
            },
            {
              id: 8003,
              purchaseOrderLineId: null,
              transactionType: 'issue',
              quantity: 12,
            },
            {
              id: 8004,
              purchaseOrderLineId: null,
              transactionType: 'adjustment',
              quantity: -3,
            },
            {
              id: 8005,
              purchaseOrderLineId: 7002,
              transactionType: 'receive',
              quantity: 5,
            },
            {
              id: 8006,
              purchaseOrderLineId: null,
              transactionType: 'return',
              quantity: 2,
            },
          ],
        },
        {
          id: 902,
          itemId: 1002,
          quantityOnHand: 5,
          createdAt: new Date('2026-03-10T06:00:00.000Z'),
          updatedAt: new Date('2026-03-10T10:30:00.000Z'),
          item: {
            name: 'Steel Bar',
            purchaseOrderLines: [
              {
                id: 7003,
                purchaseOrderId: 503,
                itemId: 1002,
                quantity: 8,
                unitPrice: 7.5,
                lineTotal: 60,
                createdAt: new Date('2026-03-09T13:00:00.000Z'),
                updatedAt: new Date('2026-03-09T13:00:00.000Z'),
              },
            ],
          },
          inventoryTransactions: [
            {
              id: 8007,
              purchaseOrderLineId: 7003,
              transactionType: 'receive',
              quantity: 8,
            },
            {
              id: 8008,
              purchaseOrderLineId: null,
              transactionType: 'issue',
              quantity: 3,
            },
          ],
        },
      ],
    });

    try {
      const response = await request(app.getHttpServer()).get('/reporting/inventory-summary');

      expect(response.status).toBe(200);
      expect(response.body.summary).toEqual({
        totalTrackedItems: 2,
        totalOnHandQuantity: 45,
        totalReceivedQuantity: 43,
        totalIssuedQuantity: 15,
        totalAdjustmentQuantity: -3,
        totalReturnedQuantity: 2,
        totalPurchaseOrderedQuantity: 53,
        totalPurchaseReceivedQuantity: 43,
        totalPurchaseOpenQuantity: 10,
      });

      const firstRow = response.body.items.find(
        (row: { inventoryItemId: number }) => row.inventoryItemId === 901,
      );
      expect(firstRow).toEqual(
        expect.objectContaining({
          inventoryItemId: 901,
          itemId: 1001,
          itemName: 'Alloy Plate',
          quantityOnHand: 40,
          receivedQuantity: 35,
          issuedQuantity: 12,
          adjustmentQuantity: -3,
          returnedQuantity: 2,
          purchaseOrderedQuantity: 45,
          purchaseReceivedQuantity: 35,
          purchaseOpenQuantity: 10,
        }),
      );

      const secondRow = response.body.items.find(
        (row: { inventoryItemId: number }) => row.inventoryItemId === 902,
      );
      expect(secondRow).toEqual(
        expect.objectContaining({
          inventoryItemId: 902,
          itemId: 1002,
          itemName: 'Steel Bar',
          quantityOnHand: 5,
          receivedQuantity: 8,
          issuedQuantity: 3,
          adjustmentQuantity: 0,
          returnedQuantity: 0,
          purchaseOrderedQuantity: 8,
          purchaseReceivedQuantity: 8,
          purchaseOpenQuantity: 0,
        }),
      );
    } finally {
      await app.close();
    }
  });

  it('returns zero-valued inventory summary when no inventory items exist', async () => {
    const app = await createApp({
      inventoryItems: [],
    });

    try {
      const response = await request(app.getHttpServer()).get('/reporting/inventory-summary');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        summary: {
          totalTrackedItems: 0,
          totalOnHandQuantity: 0,
          totalReceivedQuantity: 0,
          totalIssuedQuantity: 0,
          totalAdjustmentQuantity: 0,
          totalReturnedQuantity: 0,
          totalPurchaseOrderedQuantity: 0,
          totalPurchaseReceivedQuantity: 0,
          totalPurchaseOpenQuantity: 0,
        },
        items: [],
      });
    } finally {
      await app.close();
    }
  });
});
