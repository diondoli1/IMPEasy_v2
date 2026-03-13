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

type WorkOrderRecord = {
  id: number;
  salesOrderLineId: number;
  bomId?: number | null;
  routingId: number;
  quantity: number;
  dueDate?: Date | null;
  status: string;
  assignedOperatorId?: number | null;
  assignedWorkstation?: string | null;
  notes?: string | null;
  releasedAt?: Date | null;
  completedAt?: Date | null;
  finishedGoodsLotId?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type WorkOrderOperationRecord = {
  id: number;
  workOrderId: number;
  routingOperationId: number;
  sequence: number;
  plannedQuantity: number;
  status: string;
  assignedOperatorId?: number | null;
  workstation?: string | null;
  startedAt?: Date | null;
  pausedAt?: Date | null;
  completedAt?: Date | null;
  goodQuantity?: number | null;
  scrapQuantity?: number | null;
  reworkSourceOperationId?: number | null;
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

type SalesOrderAuditRecord = {
  id: number;
  salesOrderId: number;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  actor: string;
  createdAt: Date;
};

type SalesOrderWithRelations = SalesOrderRecord & {
  customer?: CustomerRecord;
};

type SalesOrderLineWithRelations = SalesOrderLineRecord & {
  item?: ItemRecord;
  salesOrder?: SalesOrderWithRelations;
};

type WorkOrderOperationWithRelations = WorkOrderOperationRecord & {
  routingOperation?: RoutingOperationRecord;
};

type WorkOrderWithSummaryRelations = WorkOrderRecord & {
  salesOrderLine?: SalesOrderLineWithRelations;
  bom?: null;
  routing?: RoutingRecord;
  assignedOperator?: null;
  finishedGoodsLot?: null;
};

type WorkOrderWithDetailRelations = WorkOrderWithSummaryRelations & {
  workOrderOperations: WorkOrderOperationWithRelations[];
  materialBookings: [];
  historyEntries: [];
};

type OperationWithRelations = WorkOrderOperationRecord & {
  workOrder?: WorkOrderWithSummaryRelations;
  routingOperation?: RoutingOperationRecord;
};

class PrismaServiceMock {
  private customers: CustomerRecord[] = [];
  private items: ItemRecord[] = [];
  private quotes: QuoteRecord[] = [];
  private quoteLines: QuoteLineRecord[] = [];
  private salesOrders: SalesOrderRecord[] = [];
  private salesOrderLines: SalesOrderLineRecord[] = [];
  private salesOrderAudits: SalesOrderAuditRecord[] = [];
  private routings: RoutingRecord[] = [];
  private routingOperations: RoutingOperationRecord[] = [];
  private workOrders: WorkOrderRecord[] = [];
  private workOrderOperations: WorkOrderOperationRecord[] = [];
  private productionLogs: ProductionLogRecord[] = [];
  private nextCustomerId = 1;
  private nextItemId = 1;
  private nextQuoteId = 1;
  private nextQuoteLineId = 1;
  private nextSalesOrderId = 1;
  private nextSalesOrderLineId = 1;
  private nextSalesOrderAuditId = 1;
  private nextRoutingId = 1;
  private nextRoutingOperationId = 1;
  private nextWorkOrderId = 1;
  private nextWorkOrderOperationId = 1;
  private nextProductionLogId = 1;

  private buildSalesOrderWithRelations(
    salesOrder: SalesOrderRecord | undefined,
  ): SalesOrderWithRelations | undefined {
    if (!salesOrder) {
      return undefined;
    }

    return {
      ...salesOrder,
      customer: this.customers.find((entry) => entry.id === salesOrder.customerId),
    };
  }

  private buildSalesOrderLineWithRelations(
    salesOrderLine: SalesOrderLineRecord | undefined,
  ): SalesOrderLineWithRelations | undefined {
    if (!salesOrderLine) {
      return undefined;
    }

    return {
      ...salesOrderLine,
      item: this.items.find((entry) => entry.id === salesOrderLine.itemId),
      salesOrder: this.buildSalesOrderWithRelations(
        this.salesOrders.find((entry) => entry.id === salesOrderLine.salesOrderId),
      ),
    };
  }

  private buildWorkOrderSummary(workOrder: WorkOrderRecord): WorkOrderWithSummaryRelations {
    return {
      ...workOrder,
      salesOrderLine: this.buildSalesOrderLineWithRelations(
        this.salesOrderLines.find((line) => line.id === workOrder.salesOrderLineId),
      ),
      bom: null,
      routing: this.routings.find((entry) => entry.id === workOrder.routingId),
      assignedOperator: null,
      finishedGoodsLot: null,
    };
  }

  private buildWorkOrderDetail(workOrder: WorkOrderRecord): WorkOrderWithDetailRelations {
    return {
      ...this.buildWorkOrderSummary(workOrder),
      workOrderOperations: this.workOrderOperations
        .filter((operation) => operation.workOrderId === workOrder.id)
        .sort((left, right) => {
          if (left.sequence !== right.sequence) {
            return left.sequence - right.sequence;
          }

          return left.id - right.id;
        })
        .map((operation) => ({
          ...operation,
          routingOperation: this.routingOperations.find(
            (entry) => entry.id === operation.routingOperationId,
          ),
        })),
      materialBookings: [],
      historyEntries: [],
    };
  }

  private buildOperationWithRelations(operation: WorkOrderOperationRecord): OperationWithRelations {
    const workOrder = this.workOrders.find((entry) => entry.id === operation.workOrderId);

    return {
      ...operation,
      workOrder: workOrder ? this.buildWorkOrderSummary(workOrder) : undefined,
      routingOperation: this.routingOperations.find(
        (entry) => entry.id === operation.routingOperationId,
      ),
    };
  }

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
        defaultRoutingId?: number | null;
      };
    }): Promise<ItemRecord> => {
      const now = new Date();
      const created: ItemRecord = {
        id: this.nextItemId++,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        defaultRoutingId: data.defaultRoutingId ?? null,
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
      orderBy?: { id: 'asc' | 'desc' };
    }): Promise<RoutingRecord[]> =>
      this.routings.filter((routing) => routing.itemId === where.itemId),
    findUnique: async ({ where }: { where: { id: number } }): Promise<RoutingRecord | null> =>
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
      orderBy?: Array<{ sequence?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>;
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
      include,
    }: {
      where: { id?: number; quoteId?: number };
      include?: { salesOrderLines?: boolean | { orderBy?: { id: 'asc' | 'desc' } } };
    }): Promise<
      | SalesOrderRecord
      | (SalesOrderRecord & {
          salesOrderLines: SalesOrderLineRecord[];
        })
      | null
    > => {
      const found =
        where.id !== undefined
          ? this.salesOrders.find((salesOrder) => salesOrder.id === where.id)
          : this.salesOrders.find((salesOrder) => salesOrder.quoteId === where.quoteId);

      if (!found) {
        return null;
      }

      if (include?.salesOrderLines) {
        return {
          ...found,
          salesOrderLines: this.salesOrderLines.filter((line) => line.salesOrderId === found.id),
        };
      }

      return found;
    },
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
        salesOrderAudits?: {
          create: {
            action: string;
            fromStatus: string | null;
            toStatus: string;
            actor: string;
          };
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

      if (data.salesOrderAudits?.create) {
        this.salesOrderAudits.push({
          id: this.nextSalesOrderAuditId++,
          salesOrderId: created.id,
          action: data.salesOrderAudits.create.action,
          fromStatus: data.salesOrderAudits.create.fromStatus,
          toStatus: data.salesOrderAudits.create.toStatus,
          actor: data.salesOrderAudits.create.actor,
          createdAt: now,
        });
      }

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
    }): Promise<SalesOrderRecord> => {
      const index = this.salesOrders.findIndex((salesOrder) => salesOrder.id === where.id);
      const found = this.salesOrders[index];
      const updated: SalesOrderRecord = {
        ...found,
        status: data.status ?? found.status,
        updatedAt: new Date(),
      };

      this.salesOrders[index] = updated;
      return updated;
    },
  };

  salesOrderAudit = {
    findMany: async ({
      where,
    }: {
      where: { salesOrderId: number };
      orderBy?: { id: 'asc' | 'desc' };
    }): Promise<SalesOrderAuditRecord[]> =>
      this.salesOrderAudits.filter((audit) => audit.salesOrderId === where.salesOrderId),
    create: async ({
      data,
    }: {
      data: {
        salesOrderId: number;
        action: string;
        fromStatus: string | null;
        toStatus: string;
        actor: string;
      };
    }): Promise<SalesOrderAuditRecord> => {
      const created: SalesOrderAuditRecord = {
        id: this.nextSalesOrderAuditId++,
        salesOrderId: data.salesOrderId,
        action: data.action,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        actor: data.actor,
        createdAt: new Date(),
      };

      this.salesOrderAudits.push(created);
      return created;
    },
  };

  workOrder = {
    findMany: async ({
      where,
      include,
    }: {
      where: { salesOrderLine: { salesOrderId: number } };
      include?: unknown;
      orderBy?: { id: 'asc' | 'desc' };
    }): Promise<Array<WorkOrderRecord | WorkOrderWithDetailRelations>> => {
      const salesOrderLineIds = this.salesOrderLines
        .filter((line) => line.salesOrderId === where.salesOrderLine.salesOrderId)
        .map((line) => line.id);

      const workOrders = this.workOrders
        .filter((workOrder) => salesOrderLineIds.includes(workOrder.salesOrderLineId))
        .sort((left, right) => left.id - right.id);

      return include ? workOrders.map((workOrder) => this.buildWorkOrderDetail(workOrder)) : workOrders;
    },
    findUnique: async ({
      where,
      include,
    }: {
      where: { id?: number; salesOrderLineId?: number };
      include?: unknown;
    }): Promise<
      | WorkOrderRecord
      | WorkOrderWithDetailRelations
      | null
    > => {
      const found =
        where.id !== undefined
          ? this.workOrders.find((workOrder) => workOrder.id === where.id)
          : this.workOrders.find((workOrder) => workOrder.salesOrderLineId === where.salesOrderLineId);

      if (!found) {
        return null;
      }

      return include ? this.buildWorkOrderDetail(found) : found;
    },
    create: async ({
      data,
    }: {
      data: {
        salesOrderLineId: number;
        bomId?: number | null;
        routingId: number;
        quantity: number;
        dueDate?: Date | null;
        status: string;
        assignedWorkstation?: string | null;
      };
    }): Promise<WorkOrderRecord> => {
      const now = new Date();
      const created: WorkOrderRecord = {
        id: this.nextWorkOrderId++,
        salesOrderLineId: data.salesOrderLineId,
        bomId: data.bomId ?? null,
        routingId: data.routingId,
        quantity: data.quantity,
        dueDate: data.dueDate ?? null,
        status: data.status,
        assignedOperatorId: null,
        assignedWorkstation: data.assignedWorkstation ?? null,
        notes: null,
        releasedAt: null,
        completedAt: null,
        finishedGoodsLotId: null,
        createdAt: now,
        updatedAt: now,
      };

      this.workOrders.push(created);
      return created;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: {
        status?: string;
        dueDate?: Date | null;
        assignedOperatorId?: number | null;
        assignedWorkstation?: string | null;
        notes?: string | null;
        releasedAt?: Date | null;
        completedAt?: Date | null;
        finishedGoodsLotId?: number | null;
      };
    }): Promise<WorkOrderRecord> => {
      const index = this.workOrders.findIndex((workOrder) => workOrder.id === where.id);
      const found = this.workOrders[index];
      const updated: WorkOrderRecord = {
        ...found,
        status: data.status ?? found.status,
        dueDate: data.dueDate !== undefined ? data.dueDate : (found.dueDate ?? null),
        assignedOperatorId:
          data.assignedOperatorId !== undefined
            ? data.assignedOperatorId
            : (found.assignedOperatorId ?? null),
        assignedWorkstation:
          data.assignedWorkstation !== undefined
            ? data.assignedWorkstation
            : (found.assignedWorkstation ?? null),
        notes: data.notes !== undefined ? data.notes : (found.notes ?? null),
        releasedAt:
          data.releasedAt !== undefined ? data.releasedAt : (found.releasedAt ?? null),
        completedAt:
          data.completedAt !== undefined ? data.completedAt : (found.completedAt ?? null),
        finishedGoodsLotId:
          data.finishedGoodsLotId !== undefined
            ? data.finishedGoodsLotId
            : (found.finishedGoodsLotId ?? null),
        updatedAt: new Date(),
      };

      this.workOrders[index] = updated;
      return updated;
    },
  };

  workOrderOperation = {
    findMany: async ({
      where,
      include,
    }: {
      where: { status?: { in: string[] }; workOrderId?: number };
      include?: {
        workOrder?: { include?: { salesOrderLine?: boolean } };
        routingOperation?: boolean;
      };
      orderBy?: Array<{ sequence?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>;
    }): Promise<
      Array<WorkOrderOperationRecord | OperationWithRelations>
    > => {
      let operations = [...this.workOrderOperations];
      if (where.status?.in) {
        operations = operations.filter((operation) => where.status?.in.includes(operation.status));
      }
      if (where.workOrderId !== undefined) {
        operations = operations.filter((operation) => operation.workOrderId === where.workOrderId);
      }

      operations.sort((left, right) => {
        if (left.sequence !== right.sequence) {
          return left.sequence - right.sequence;
        }

        return left.id - right.id;
      });

      return include ? operations.map((operation) => this.buildOperationWithRelations(operation)) : operations;
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
        workstation?: string | null;
        assignedOperatorId?: number | null;
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
        assignedOperatorId: data.assignedOperatorId ?? null,
        workstation: data.workstation ?? null,
        startedAt: null,
        pausedAt: null,
        completedAt: null,
        goodQuantity: null,
        scrapQuantity: null,
        reworkSourceOperationId: data.reworkSourceOperationId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.workOrderOperations.push(created);
      return created;
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: {
        status?: string;
        assignedOperatorId?: number | null;
        plannedQuantity?: number;
        workstation?: string | null;
        startedAt?: Date | null;
        pausedAt?: Date | null;
        completedAt?: Date | null;
        goodQuantity?: number | null;
        scrapQuantity?: number | null;
      };
    }): Promise<WorkOrderOperationRecord> => {
      const index = this.workOrderOperations.findIndex((operation) => operation.id === where.id);
      const found = this.workOrderOperations[index];
      const updated: WorkOrderOperationRecord = {
        ...found,
        status: data.status ?? found.status,
        assignedOperatorId:
          data.assignedOperatorId !== undefined
            ? data.assignedOperatorId
            : (found.assignedOperatorId ?? null),
        plannedQuantity: data.plannedQuantity ?? found.plannedQuantity,
        workstation:
          data.workstation !== undefined ? data.workstation : (found.workstation ?? null),
        startedAt:
          data.startedAt !== undefined ? data.startedAt : (found.startedAt ?? null),
        pausedAt: data.pausedAt !== undefined ? data.pausedAt : (found.pausedAt ?? null),
        completedAt:
          data.completedAt !== undefined ? data.completedAt : (found.completedAt ?? null),
        goodQuantity:
          data.goodQuantity !== undefined ? data.goodQuantity : (found.goodQuantity ?? null),
        scrapQuantity:
          data.scrapQuantity !== undefined ? data.scrapQuantity : (found.scrapQuantity ?? null),
        updatedAt: new Date(),
      };

      this.workOrderOperations[index] = updated;
      return updated;
    },
    findUnique: async ({
      where,
      include,
    }: {
      where: { id?: number; reworkSourceOperationId?: number };
      include?: {
        workOrder?: { include?: { salesOrderLine?: boolean } };
        routingOperation?: boolean;
      };
    }): Promise<
      | (WorkOrderOperationRecord | OperationWithRelations)
      | null
    > => {
      const found =
        where.id !== undefined
          ? this.workOrderOperations.find((operation) => operation.id === where.id)
          : this.workOrderOperations.find(
              (operation) => operation.reworkSourceOperationId === where.reworkSourceOperationId,
            );
      if (!found) {
        return null;
      }

      return include ? this.buildOperationWithRelations(found) : found;
    },
  };

  productionLog = {
    findMany: async ({
      where,
    }: {
      where: { operationId: number };
      orderBy?: { id: 'asc' | 'desc' };
    }): Promise<ProductionLogRecord[]> =>
      this.productionLogs
        .filter((log) => log.operationId === where.operationId)
        .sort((left, right) => left.id - right.id),
    create: async ({
      data,
    }: {
      data: {
        operationId: number;
        quantity: number;
        notes: string | null;
      };
    }): Promise<ProductionLogRecord> => {
      const now = new Date();
      const created: ProductionLogRecord = {
        id: this.nextProductionLogId++,
        operationId: data.operationId,
        quantity: data.quantity,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };

      this.productionLogs.push(created);
      return created;
    },
  };
}

describe('SalesOrdersController (e2e)', () => {
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

  it('returns sales order detail after quote conversion', async () => {
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
      notes: 'Sales order detail test',
    });

    await request(app.getHttpServer())
      .post(`/quotes/${quoteResponse.body.id}/lines`)
      .send({
        itemId: itemResponse.body.id,
        quantity: 4,
        unitPrice: 9.5,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'sent' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const convertResponse = await request(app.getHttpServer()).post(
      `/quotes/${quoteResponse.body.id}/convert`,
    );
    const salesOrderId = convertResponse.body.salesOrder.id as number;

    const detailResponse = await request(app.getHttpServer()).get(`/sales-orders/${salesOrderId}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(salesOrderId);
    expect(detailResponse.body.quoteId).toBe(quoteResponse.body.id);
    expect(detailResponse.body.customerId).toBe(customerResponse.body.id);
    expect(detailResponse.body.status).toBe('draft');
    expect(detailResponse.body.salesOrderLines).toHaveLength(1);
    expect(detailResponse.body.salesOrderLines[0].itemId).toBe(itemResponse.body.id);
    expect(detailResponse.body.salesOrderLines[0].lineTotal).toBe(38);

    const auditResponse = await request(app.getHttpServer()).get(`/sales-orders/${salesOrderId}/audit`);
    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body).toHaveLength(1);
    expect(auditResponse.body[0].action).toBe('created_from_quote');
    expect(auditResponse.body[0].toStatus).toBe('draft');
  });

  it('returns 404 for missing sales order', async () => {
    const response = await request(app.getHttpServer()).get('/sales-orders/999');
    expect(response.status).toBe(404);
  });

  it('returns 404 for missing sales order audit trail', async () => {
    const response = await request(app.getHttpServer()).get('/sales-orders/999/audit');
    expect(response.status).toBe(404);
  });

  it('generates and lists work orders for released sales orders', async () => {
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
      notes: 'Work order generation',
    });

    await request(app.getHttpServer())
      .post(`/quotes/${quoteResponse.body.id}/lines`)
      .send({
        itemId: itemResponse.body.id,
        quantity: 4,
        unitPrice: 9.5,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const convertResponse = await request(app.getHttpServer()).post(
      `/quotes/${quoteResponse.body.id}/convert`,
    );
    const salesOrderId = convertResponse.body.salesOrder.id as number;

    const routingResponse = await request(app.getHttpServer()).post('/routings').send({
      itemId: itemResponse.body.id,
      name: 'Primary Routing',
      description: 'Main path',
    });
    expect(routingResponse.status).toBe(201);

    await request(app.getHttpServer())
      .post(`/routings/${routingResponse.body.id}/operations`)
      .send({
        sequence: 10,
        name: 'Laser Cutting',
        description: 'Cut profile',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/routings/${routingResponse.body.id}/default`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'confirmed' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'released' })
      .expect(200);

    const generateResponse = await request(app.getHttpServer()).post(
      `/sales-orders/${salesOrderId}/work-orders/generate`,
    );
    expect(generateResponse.status).toBe(201);
    expect(generateResponse.body).toHaveLength(1);
    expect(generateResponse.body[0].status).toBe('planned');

    const releaseResponse = await request(app.getHttpServer()).post(
      `/manufacturing-orders/${generateResponse.body[0].id}/release`,
    );
    expect(releaseResponse.status).toBe(201);
    expect(releaseResponse.body.status).toBe('released');

    const listResponse = await request(app.getHttpServer()).get(
      `/sales-orders/${salesOrderId}/work-orders`,
    );
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].routingId).toBe(routingResponse.body.id);

    const queueResponse = await request(app.getHttpServer()).get('/operations/queue');
    expect(queueResponse.status).toBe(200);
    expect(queueResponse.body).toHaveLength(1);
    expect(queueResponse.body[0].operationName).toBe('Laser Cutting');
    expect(queueResponse.body[0].status).toBe('ready');

    const operationDetailResponse = await request(app.getHttpServer()).get(
      `/operations/${queueResponse.body[0].id}`,
    );
    expect(operationDetailResponse.status).toBe(200);
    expect(operationDetailResponse.body.salesOrderId).toBe(salesOrderId);
    expect(operationDetailResponse.body.operationName).toBe('Laser Cutting');

    const workOrderDetailResponse = await request(app.getHttpServer()).get(
      `/work-orders/${generateResponse.body[0].id}`,
    );
    expect(workOrderDetailResponse.status).toBe(200);
    expect(workOrderDetailResponse.body.salesOrderId).toBe(salesOrderId);
    expect(workOrderDetailResponse.body.itemId).toBe(itemResponse.body.id);

    const secondGenerateResponse = await request(app.getHttpServer()).post(
      `/sales-orders/${salesOrderId}/work-orders/generate`,
    );
    expect(secondGenerateResponse.status).toBe(201);
    expect(secondGenerateResponse.body).toHaveLength(1);
    expect(secondGenerateResponse.body[0].id).toBe(generateResponse.body[0].id);
  });

  it('starts and pauses operations with valid transitions and rejects invalid ones', async () => {
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
      notes: 'Start operation transition',
    });

    await request(app.getHttpServer())
      .post(`/quotes/${quoteResponse.body.id}/lines`)
      .send({
        itemId: itemResponse.body.id,
        quantity: 4,
        unitPrice: 9.5,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const convertResponse = await request(app.getHttpServer()).post(
      `/quotes/${quoteResponse.body.id}/convert`,
    );
    const salesOrderId = convertResponse.body.salesOrder.id as number;

    const routingResponse = await request(app.getHttpServer()).post('/routings').send({
      itemId: itemResponse.body.id,
      name: 'Primary Routing',
      description: 'Main path',
    });
    expect(routingResponse.status).toBe(201);

    await request(app.getHttpServer())
      .post(`/routings/${routingResponse.body.id}/operations`)
      .send({
        sequence: 10,
        name: 'Laser Cutting',
        description: 'Cut profile',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/routings/${routingResponse.body.id}/operations`)
      .send({
        sequence: 20,
        name: 'Deburr',
        description: 'Deburr edges',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/routings/${routingResponse.body.id}/default`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'confirmed' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'released' })
      .expect(200);

    const generateResponse = await request(app.getHttpServer())
      .post(`/sales-orders/${salesOrderId}/work-orders/generate`)
      .expect(201);
    expect(generateResponse.body).toHaveLength(1);

    await request(app.getHttpServer())
      .post(`/manufacturing-orders/${generateResponse.body[0].id}/release`)
      .expect(201);

    const queueResponse = await request(app.getHttpServer()).get('/operations/queue');
    expect(queueResponse.status).toBe(200);
    expect(queueResponse.body).toHaveLength(2);

    const readyOperationId = queueResponse.body[0].id as number;
    const queuedOperationId = queueResponse.body[1].id as number;

    const startReadyResponse = await request(app.getHttpServer()).post(
      `/operations/${readyOperationId}/start`,
    );
    expect(startReadyResponse.status).toBe(201);
    expect(startReadyResponse.body.id).toBe(readyOperationId);
    expect(startReadyResponse.body.status).toBe('running');

    const startedOperationDetail = await request(app.getHttpServer()).get(
      `/operations/${readyOperationId}`,
    );
    expect(startedOperationDetail.status).toBe(200);
    expect(startedOperationDetail.body.status).toBe('running');

    const restartRunningResponse = await request(app.getHttpServer()).post(
      `/operations/${readyOperationId}/start`,
    );
    expect(restartRunningResponse.status).toBe(400);

    const startQueuedResponse = await request(app.getHttpServer()).post(
      `/operations/${queuedOperationId}/start`,
    );
    expect(startQueuedResponse.status).toBe(400);

    const pauseRunningResponse = await request(app.getHttpServer()).post(
      `/operations/${readyOperationId}/pause`,
    );
    expect(pauseRunningResponse.status).toBe(201);
    expect(pauseRunningResponse.body.id).toBe(readyOperationId);
    expect(pauseRunningResponse.body.status).toBe('paused');

    const pausedOperationDetail = await request(app.getHttpServer()).get(
      `/operations/${readyOperationId}`,
    );
    expect(pausedOperationDetail.status).toBe(200);
    expect(pausedOperationDetail.body.status).toBe('paused');

    const repausePausedResponse = await request(app.getHttpServer()).post(
      `/operations/${readyOperationId}/pause`,
    );
    expect(repausePausedResponse.status).toBe(400);

    const pauseQueuedResponse = await request(app.getHttpServer()).post(
      `/operations/${queuedOperationId}/pause`,
    );
    expect(pauseQueuedResponse.status).toBe(400);
  });

  it('completes running operations and rejects invalid complete transitions', async () => {
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
      notes: 'Complete operation transition',
    });

    await request(app.getHttpServer())
      .post(`/quotes/${quoteResponse.body.id}/lines`)
      .send({
        itemId: itemResponse.body.id,
        quantity: 4,
        unitPrice: 9.5,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const convertResponse = await request(app.getHttpServer()).post(
      `/quotes/${quoteResponse.body.id}/convert`,
    );
    const salesOrderId = convertResponse.body.salesOrder.id as number;

    const routingResponse = await request(app.getHttpServer()).post('/routings').send({
      itemId: itemResponse.body.id,
      name: 'Primary Routing',
      description: 'Main path',
    });
    expect(routingResponse.status).toBe(201);

    await request(app.getHttpServer())
      .post(`/routings/${routingResponse.body.id}/operations`)
      .send({
        sequence: 10,
        name: 'Laser Cutting',
        description: 'Cut profile',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/routings/${routingResponse.body.id}/operations`)
      .send({
        sequence: 20,
        name: 'Deburr',
        description: 'Deburr edges',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/routings/${routingResponse.body.id}/default`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'confirmed' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'released' })
      .expect(200);

    const generateResponse = await request(app.getHttpServer())
      .post(`/sales-orders/${salesOrderId}/work-orders/generate`)
      .expect(201);
    expect(generateResponse.body).toHaveLength(1);

    await request(app.getHttpServer())
      .post(`/manufacturing-orders/${generateResponse.body[0].id}/release`)
      .expect(201);

    const queueResponse = await request(app.getHttpServer()).get('/operations/queue');
    expect(queueResponse.status).toBe(200);
    expect(queueResponse.body).toHaveLength(2);

    const readyOperationId = queueResponse.body[0].id as number;
    const queuedOperationId = queueResponse.body[1].id as number;

    await request(app.getHttpServer()).post(`/operations/${readyOperationId}/start`).expect(201);

    const completeRunningResponse = await request(app.getHttpServer()).post(
      `/operations/${readyOperationId}/complete`,
    );
    expect(completeRunningResponse.status).toBe(201);
    expect(completeRunningResponse.body.id).toBe(readyOperationId);
    expect(completeRunningResponse.body.status).toBe('completed');

    const completedOperationDetail = await request(app.getHttpServer()).get(
      `/operations/${readyOperationId}`,
    );
    expect(completedOperationDetail.status).toBe(200);
    expect(completedOperationDetail.body.status).toBe('completed');

    const recompleteCompletedResponse = await request(app.getHttpServer()).post(
      `/operations/${readyOperationId}/complete`,
    );
    expect(recompleteCompletedResponse.status).toBe(400);

    const completeQueuedResponse = await request(app.getHttpServer()).post(
      `/operations/${queuedOperationId}/complete`,
    );
    expect(completeQueuedResponse.status).toBe(400);
  });

  it('creates and lists production logs for running operations', async () => {
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
      notes: 'Production logs',
    });

    await request(app.getHttpServer())
      .post(`/quotes/${quoteResponse.body.id}/lines`)
      .send({
        itemId: itemResponse.body.id,
        quantity: 4,
        unitPrice: 9.5,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const convertResponse = await request(app.getHttpServer()).post(
      `/quotes/${quoteResponse.body.id}/convert`,
    );
    const salesOrderId = convertResponse.body.salesOrder.id as number;

    const routingResponse = await request(app.getHttpServer()).post('/routings').send({
      itemId: itemResponse.body.id,
      name: 'Primary Routing',
      description: 'Main path',
    });
    expect(routingResponse.status).toBe(201);

    await request(app.getHttpServer())
      .post(`/routings/${routingResponse.body.id}/operations`)
      .send({
        sequence: 10,
        name: 'Laser Cutting',
        description: 'Cut profile',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/routings/${routingResponse.body.id}/operations`)
      .send({
        sequence: 20,
        name: 'Deburr',
        description: 'Deburr edges',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/routings/${routingResponse.body.id}/default`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'confirmed' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'released' })
      .expect(200);

    const generateResponse = await request(app.getHttpServer())
      .post(`/sales-orders/${salesOrderId}/work-orders/generate`)
      .expect(201);
    expect(generateResponse.body).toHaveLength(1);

    await request(app.getHttpServer())
      .post(`/manufacturing-orders/${generateResponse.body[0].id}/release`)
      .expect(201);

    const queueResponse = await request(app.getHttpServer()).get('/operations/queue');
    expect(queueResponse.status).toBe(200);
    expect(queueResponse.body).toHaveLength(2);

    const readyOperationId = queueResponse.body[0].id as number;
    const queuedOperationId = queueResponse.body[1].id as number;

    const notRunningResponse = await request(app.getHttpServer())
      .post(`/operations/${queuedOperationId}/logs`)
      .send({
        quantity: 2,
        notes: 'Should fail',
      });
    expect(notRunningResponse.status).toBe(400);

    await request(app.getHttpServer()).post(`/operations/${readyOperationId}/start`).expect(201);

    const invalidQuantityResponse = await request(app.getHttpServer())
      .post(`/operations/${readyOperationId}/logs`)
      .send({
        quantity: 0,
        notes: 'Invalid quantity',
      });
    expect(invalidQuantityResponse.status).toBe(400);

    const firstLogResponse = await request(app.getHttpServer())
      .post(`/operations/${readyOperationId}/logs`)
      .send({
        quantity: 3,
        notes: 'First log',
      });
    expect(firstLogResponse.status).toBe(201);
    expect(firstLogResponse.body.operationId).toBe(readyOperationId);
    expect(firstLogResponse.body.quantity).toBe(3);
    expect(firstLogResponse.body.notes).toBe('First log');

    const secondLogResponse = await request(app.getHttpServer())
      .post(`/operations/${readyOperationId}/logs`)
      .send({
        quantity: 1,
      });
    expect(secondLogResponse.status).toBe(201);
    expect(secondLogResponse.body.quantity).toBe(1);
    expect(secondLogResponse.body.notes).toBeNull();

    const listResponse = await request(app.getHttpServer()).get(
      `/operations/${readyOperationId}/logs`,
    );
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(2);
    expect(listResponse.body[0].id).toBe(firstLogResponse.body.id);
    expect(listResponse.body[0].quantity).toBe(3);
    expect(listResponse.body[1].id).toBe(secondLogResponse.body.id);
    expect(listResponse.body[1].quantity).toBe(1);
  });

  it('rejects work order generation when sales order is not released or routing defaults missing', async () => {
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
      notes: 'Work order validation',
    });

    await request(app.getHttpServer())
      .post(`/quotes/${quoteResponse.body.id}/lines`)
      .send({
        itemId: itemResponse.body.id,
        quantity: 4,
        unitPrice: 9.5,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const convertResponse = await request(app.getHttpServer()).post(
      `/quotes/${quoteResponse.body.id}/convert`,
    );
    const salesOrderId = convertResponse.body.salesOrder.id as number;

    const notReleased = await request(app.getHttpServer()).post(
      `/sales-orders/${salesOrderId}/work-orders/generate`,
    );
    expect(notReleased.status).toBe(400);

    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'confirmed' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'released' })
      .expect(200);

    const missingDefaultRouting = await request(app.getHttpServer()).post(
      `/sales-orders/${salesOrderId}/work-orders/generate`,
    );
    expect(missingDefaultRouting.status).toBe(400);

    const missingSalesOrderGenerate = await request(app.getHttpServer()).post(
      '/sales-orders/999/work-orders/generate',
    );
    expect(missingSalesOrderGenerate.status).toBe(404);

    const missingSalesOrderList = await request(app.getHttpServer()).get('/sales-orders/999/work-orders');
    expect(missingSalesOrderList.status).toBe(404);

    const missingWorkOrder = await request(app.getHttpServer()).get('/work-orders/999');
    expect(missingWorkOrder.status).toBe(404);

    const missingOperation = await request(app.getHttpServer()).get('/operations/999');
    expect(missingOperation.status).toBe(404);

    const missingOperationStart = await request(app.getHttpServer()).post('/operations/999/start');
    expect(missingOperationStart.status).toBe(404);

    const missingOperationPause = await request(app.getHttpServer()).post('/operations/999/pause');
    expect(missingOperationPause.status).toBe(404);

    const missingOperationComplete = await request(app.getHttpServer()).post(
      '/operations/999/complete',
    );
    expect(missingOperationComplete.status).toBe(404);

    const missingOperationLogs = await request(app.getHttpServer()).get('/operations/999/logs');
    expect(missingOperationLogs.status).toBe(404);

    const missingOperationLogCreate = await request(app.getHttpServer())
      .post('/operations/999/logs')
      .send({
        quantity: 1,
      });
    expect(missingOperationLogCreate.status).toBe(404);
  });

  it('applies valid lifecycle transitions and rejects invalid transitions', async () => {
    const customerResponse = await request(app.getHttpServer()).post('/customers').send({
      name: 'Apex Manufacturing',
      email: 'ops@apex.test',
      phone: '+1 555 111 2233',
    });

    const quoteResponse = await request(app.getHttpServer()).post('/quotes').send({
      customerId: customerResponse.body.id,
      notes: 'Status lifecycle',
    });

    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'sent' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/quotes/${quoteResponse.body.id}/status`)
      .send({ status: 'approved' })
      .expect(200);

    const convertResponse = await request(app.getHttpServer()).post(
      `/quotes/${quoteResponse.body.id}/convert`,
    );
    const salesOrderId = convertResponse.body.salesOrder.id as number;

    const invalidTransition = await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'released' });
    expect(invalidTransition.status).toBe(400);

    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'confirmed' })
      .expect(200);

    const auditAfterConfirm = await request(app.getHttpServer()).get(
      `/sales-orders/${salesOrderId}/audit`,
    );
    expect(auditAfterConfirm.status).toBe(200);
    expect(auditAfterConfirm.body).toHaveLength(2);
    expect(auditAfterConfirm.body[1].action).toBe('status_transition');
    expect(auditAfterConfirm.body[1].fromStatus).toBe('draft');
    expect(auditAfterConfirm.body[1].toStatus).toBe('confirmed');

    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'released' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'in_production' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'shipped' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'invoiced' })
      .expect(200);

    const closeResponse = await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'closed' });
    expect(closeResponse.status).toBe(200);
    expect(closeResponse.body.status).toBe('closed');

    const invalidFromClosed = await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'shipped' });
    expect(invalidFromClosed.status).toBe(400);

    const invalidPayload = await request(app.getHttpServer())
      .patch(`/sales-orders/${salesOrderId}/status`)
      .send({ status: 'draft' });
    expect(invalidPayload.status).toBe(400);

    const missingOrder = await request(app.getHttpServer())
      .patch('/sales-orders/999/status')
      .send({ status: 'confirmed' });
    expect(missingOrder.status).toBe(404);
  });
});
