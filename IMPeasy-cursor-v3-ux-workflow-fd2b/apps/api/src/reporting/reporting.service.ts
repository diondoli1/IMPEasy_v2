import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { InventorySummaryReportResponseDto } from './dto/inventory-summary-report-response.dto';
import { InventorySummaryReportRowDto } from './dto/inventory-summary-report-row.dto';
import { InventorySummaryReportSummaryDto } from './dto/inventory-summary-report-summary.dto';
import { ModuleDashboardResponseDto } from './dto/module-dashboard-response.dto';
import { OrderStatusDashboardInvoiceCountsDto } from './dto/order-status-dashboard-invoice-counts.dto';
import { OrderStatusDashboardResponseDto } from './dto/order-status-dashboard-response.dto';
import { OrderStatusDashboardRowDto } from './dto/order-status-dashboard-row.dto';
import { OrderStatusDashboardShipmentCountsDto } from './dto/order-status-dashboard-shipment-counts.dto';
import { OrderStatusDashboardSummaryDto } from './dto/order-status-dashboard-summary.dto';
import { ProductionPerformanceDashboardResponseDto } from './dto/production-performance-dashboard-response.dto';
import { ProductionPerformanceDashboardRowDto } from './dto/production-performance-dashboard-row.dto';
import { ProductionPerformanceDashboardSummaryDto } from './dto/production-performance-dashboard-summary.dto';
import { SalesReportResponseDto } from './dto/sales-report-response.dto';
import { SalesReportRowDto } from './dto/sales-report-row.dto';
import { SalesReportSummaryDto } from './dto/sales-report-summary.dto';

const ORDER_STATUS_DASHBOARD_INCLUDE = {
  customer: true,
  salesOrderLines: {
    include: {
      workOrder: {
        include: {
          workOrderOperations: {
            include: {
              inspection: true,
            },
            orderBy: [{ sequence: 'asc' as const }, { id: 'asc' as const }],
          },
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
  shipments: {
    include: {
      invoice: true,
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.SalesOrderInclude;

type SalesOrderDashboardRecord = Prisma.SalesOrderGetPayload<{
  include: typeof ORDER_STATUS_DASHBOARD_INCLUDE;
}>;

type WorkOrderOperations = NonNullable<
  SalesOrderDashboardRecord['salesOrderLines'][number]['workOrder']
>['workOrderOperations'];

type ShipmentStatus = keyof OrderStatusDashboardShipmentCountsDto;
type InvoiceStatus = keyof OrderStatusDashboardInvoiceCountsDto;

const SALES_ORDER_STATUS_TO_SUMMARY_KEY: Record<string, keyof OrderStatusDashboardSummaryDto> = {
  draft: 'draftCount',
  confirmed: 'confirmedCount',
  released: 'releasedCount',
  in_production: 'inProductionCount',
  shipped: 'shippedCount',
  invoiced: 'invoicedCount',
  closed: 'closedCount',
};

const SHIPMENT_STATUSES: ShipmentStatus[] = ['draft', 'packed', 'shipped', 'delivered'];
const INVOICE_STATUSES: InvoiceStatus[] = ['issued', 'paid'];

const PRODUCTION_PERFORMANCE_DASHBOARD_INCLUDE = {
  salesOrderLine: {
    include: {
      item: true,
      salesOrder: {
        include: {
          customer: true,
        },
      },
    },
  },
  workOrderOperations: {
    include: {
      inspection: true,
      productionLogs: true,
    },
    orderBy: [{ sequence: 'asc' as const }, { id: 'asc' as const }],
  },
} satisfies Prisma.WorkOrderInclude;

type ProductionDashboardWorkOrderRecord = Prisma.WorkOrderGetPayload<{
  include: typeof PRODUCTION_PERFORMANCE_DASHBOARD_INCLUDE;
}>;

type ProductionDashboardOperationRecord =
  ProductionDashboardWorkOrderRecord['workOrderOperations'][number];

type ProductionWorkOrderStatusSummaryKey = Exclude<
  keyof ProductionPerformanceDashboardSummaryDto,
  | 'totalWorkOrders'
  | 'totalOperations'
  | 'queuedOperations'
  | 'readyOperations'
  | 'runningOperations'
  | 'pausedOperations'
  | 'completedOperations'
  | 'pendingInspections'
  | 'passedInspections'
  | 'failedInspections'
  | 'reworkRequiredInspections'
  | 'totalPlannedQuantity'
  | 'totalRecordedQuantity'
  | 'totalScrappedQuantity'
>;

const WORK_ORDER_STATUS_TO_SUMMARY_KEY: Record<string, ProductionWorkOrderStatusSummaryKey> = {
  planned: 'plannedWorkOrders',
  released: 'releasedWorkOrders',
  in_progress: 'inProgressWorkOrders',
  completed: 'completedWorkOrders',
  closed: 'closedWorkOrders',
};

const INVENTORY_SUMMARY_REPORT_INCLUDE = {
  item: {
    include: {
      purchaseOrderLines: {
        orderBy: { id: 'asc' as const },
      },
    },
  },
  inventoryTransactions: {
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.InventoryItemInclude;

type InventorySummaryReportItemRecord = Prisma.InventoryItemGetPayload<{
  include: typeof INVENTORY_SUMMARY_REPORT_INCLUDE;
}>;

type InventorySummaryReportTransactionRecord =
  InventorySummaryReportItemRecord['inventoryTransactions'][number];

const SALES_REPORT_INCLUDE = {
  customer: true,
  salesOrderLines: {
    orderBy: { id: 'asc' as const },
  },
  shipments: {
    include: {
      shipmentLines: {
        include: {
          salesOrderLine: {
            select: {
              unitPrice: true,
            },
          },
        },
        orderBy: { id: 'asc' as const },
      },
      invoice: {
        include: {
          invoiceLines: {
            orderBy: { id: 'asc' as const },
          },
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.SalesOrderInclude;

type SalesReportOrderRecord = Prisma.SalesOrderGetPayload<{
  include: typeof SALES_REPORT_INCLUDE;
}>;

type SalesReportShipmentRecord = SalesReportOrderRecord['shipments'][number];
type SalesReportInvoiceRecord = NonNullable<SalesReportShipmentRecord['invoice']>;

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrderStatusDashboard(): Promise<OrderStatusDashboardResponseDto> {
    const salesOrders = await this.prisma.salesOrder.findMany({
      include: ORDER_STATUS_DASHBOARD_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      summary: this.buildSummary(salesOrders),
      orders: salesOrders.map((salesOrder) => this.mapOrder(salesOrder)),
    };
  }

  async getProductionPerformanceDashboard(): Promise<ProductionPerformanceDashboardResponseDto> {
    const workOrders = await this.prisma.workOrder.findMany({
      include: PRODUCTION_PERFORMANCE_DASHBOARD_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    const rows = workOrders.map((workOrder) => this.mapProductionWorkOrder(workOrder));

    return {
      summary: this.buildProductionSummary(workOrders, rows),
      workOrders: rows,
    };
  }

  async getInventorySummaryReport(): Promise<InventorySummaryReportResponseDto> {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      include: INVENTORY_SUMMARY_REPORT_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });

    const rows = inventoryItems.map((inventoryItem) => this.mapInventorySummaryItem(inventoryItem));

    return {
      summary: this.buildInventorySummary(rows),
      items: rows,
    };
  }

  async getSalesReport(): Promise<SalesReportResponseDto> {
    const salesOrders = await this.prisma.salesOrder.findMany({
      include: SALES_REPORT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    const rows = salesOrders.map((salesOrder) => this.mapSalesReportOrder(salesOrder));

    return {
      summary: this.buildSalesReportSummary(rows),
      orders: rows,
    };
  }

  async getCustomerOrdersDashboard(): Promise<ModuleDashboardResponseDto> {
    const [
      openQuotes,
      draftOrders,
      releasedOrders,
      waitingForShipment,
      waitingForInvoice,
      releasedAndInProductionOrders,
    ] = await Promise.all([
      this.prisma.quote.count({
        where: {
          status: {
            in: ['draft', 'sent', 'approved'],
          },
        },
      }),
      this.prisma.salesOrder.count({
        where: {
          status: 'draft',
        },
      }),
      this.prisma.salesOrder.count({
        where: {
          status: 'released',
        },
      }),
      this.prisma.salesOrder.count({
        where: {
          status: {
            in: ['released', 'in_production'],
          },
        },
      }),
      this.prisma.shipment.count({
        where: {
          status: 'delivered',
          invoice: null,
        },
      }),
      this.prisma.salesOrder.findMany({
        where: {
          status: {
            in: ['released', 'in_production'],
          },
        },
        select: {
          id: true,
          salesOrderLines: {
            select: {
              id: true,
              workOrder: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const waitingForManufacturingOrders = releasedAndInProductionOrders.filter((salesOrder) =>
      salesOrder.salesOrderLines.some((line) => line.workOrder === null),
    ).length;

    return {
      module: 'customer-orders',
      generatedAt: new Date(),
      cards: [
        {
          key: 'open_quotes',
          label: 'Open quotes',
          value: openQuotes,
          hint: 'Quotes waiting for customer action or conversion.',
          href: '/quotes',
        },
        {
          key: 'draft_orders',
          label: 'Draft orders',
          value: draftOrders,
          hint: 'Sales orders not yet ready for release.',
          href: '/sales-orders',
        },
        {
          key: 'released_orders',
          label: 'Released orders',
          value: releasedOrders,
          hint: 'Orders already driving production.',
          href: '/sales-orders',
        },
        {
          key: 'waiting_for_mo',
          label: 'Waiting for MO',
          value: waitingForManufacturingOrders,
          hint: 'Released lines missing a Manufacturing Order.',
          href: '/customer-orders',
        },
        {
          key: 'waiting_for_shipment',
          label: 'Waiting for shipment',
          value: waitingForShipment,
          hint: 'Released production demand still pending shipment.',
          href: '/shipments',
        },
        {
          key: 'waiting_for_invoice',
          label: 'Waiting for invoice',
          value: waitingForInvoice,
          hint: 'Delivered shipments that still need invoicing.',
          href: '/invoices',
        },
      ],
    };
  }

  async getProductionDashboard(): Promise<ModuleDashboardResponseDto> {
    const [
      plannedMOs,
      releasedMOs,
      inProgressMOs,
      readyOperations,
      runningOperations,
      overdueMOs,
    ] = await Promise.all([
      this.prisma.workOrder.count({
        where: {
          status: 'planned',
        },
      }),
      this.prisma.workOrder.count({
        where: {
          status: 'released',
        },
      }),
      this.prisma.workOrder.count({
        where: {
          status: 'in_progress',
        },
      }),
      this.prisma.workOrderOperation.count({
        where: {
          status: 'ready',
        },
      }),
      this.prisma.workOrderOperation.count({
        where: {
          status: 'running',
        },
      }),
      this.prisma.workOrder.count({
        where: {
          status: {
            in: ['planned', 'released', 'in_progress'],
          },
          dueDate: {
            lt: new Date(),
          },
        },
      }),
    ]);

    return {
      module: 'production',
      generatedAt: new Date(),
      cards: [
        {
          key: 'planned_mos',
          label: 'Planned MOs',
          value: plannedMOs,
          hint: 'Manufacturing Orders staged but not released.',
          href: '/manufacturing-orders',
        },
        {
          key: 'released_mos',
          label: 'Released MOs',
          value: releasedMOs,
          hint: 'Released orders waiting on operation progress.',
          href: '/manufacturing-orders',
        },
        {
          key: 'in_progress_mos',
          label: 'In-progress MOs',
          value: inProgressMOs,
          hint: 'Orders currently active on the floor.',
          href: '/manufacturing-orders',
        },
        {
          key: 'ready_operations',
          label: 'Ready operations',
          value: readyOperations,
          hint: 'Operations ready for operator start.',
          href: '/operations/queue',
        },
        {
          key: 'running_operations',
          label: 'Running operations',
          value: runningOperations,
          hint: 'Operations currently consuming capacity.',
          href: '/operations/queue',
        },
        {
          key: 'overdue_mos',
          label: 'Overdue MOs',
          value: overdueMOs,
          hint: 'Open orders past their due date.',
          href: '/manufacturing-orders',
        },
      ],
    };
  }

  async getInventoryDashboard(): Promise<ModuleDashboardResponseDto> {
    const purchaseMetrics = await this.getPurchaseReceiptMetrics();
    const [trackedItems, lotsInStock, criticalOnHandItems, reservedStock, wipStock] =
      await Promise.all([
        this.prisma.inventoryItem.count(),
        this.prisma.stockLot.count({
          where: {
            quantityOnHand: {
              gt: 0,
            },
          },
        }),
        this.prisma.inventoryItem.count({
          where: {
            item: {
              reorderPoint: {
                gt: 0,
              },
            },
            quantityOnHand: {
              lte: 0,
            },
          },
        }),
        this.getReservedStockQuantity(),
        this.prisma.workOrder.count({
          where: {
            status: {
              in: ['released', 'in_progress'],
            },
          },
        }),
      ]);

    return {
      module: 'inventory',
      generatedAt: new Date(),
      cards: [
        {
          key: 'tracked_items',
          label: 'Tracked items',
          value: trackedItems,
          hint: 'Inventory records tracked in the single MVP location.',
          href: '/stock/items',
        },
        {
          key: 'lots_in_stock',
          label: 'Lots in stock',
          value: lotsInStock,
          hint: 'Lots currently carrying on-hand quantity.',
          href: '/stock/lots',
        },
        {
          key: 'critical_on_hand',
          label: 'Critical on-hand',
          value: criticalOnHandItems,
          hint: 'Items currently at or below practical availability.',
          href: '/stock/critical-on-hand',
        },
        {
          key: 'expected_receipts',
          label: 'Expected receipts',
          value: purchaseMetrics.expectedReceiptLines,
          hint: 'Open purchase lines still expected into stock.',
          href: '/purchase-orders',
        },
        {
          key: 'reserved_stock',
          label: 'Reserved stock',
          value: reservedStock,
          hint: 'Quantity currently reserved by booking and picks.',
          href: '/stock/movements',
        },
        {
          key: 'wip_stock',
          label: 'WIP stock',
          value: wipStock,
          hint: 'Open manufacturing orders consuming material.',
          href: '/manufacturing-orders',
        },
      ],
    };
  }

  async getPurchasingDashboard(): Promise<ModuleDashboardResponseDto> {
    const purchaseMetrics = await this.getPurchaseReceiptMetrics();
    const [draftPOs, openPOs, itemsWithoutPreferredVendor] = await Promise.all([
      this.prisma.purchaseOrder.count({
        where: {
          status: 'draft',
        },
      }),
      this.prisma.purchaseOrder.count({
        where: {
          status: {
            in: ['open', 'partial'],
          },
        },
      }),
      this.prisma.item.count({
        where: {
          isActive: true,
          itemType: 'procured',
          preferredVendorId: null,
        },
      }),
    ]);

    return {
      module: 'purchasing',
      generatedAt: new Date(),
      cards: [
        {
          key: 'draft_pos',
          label: 'Draft POs',
          value: draftPOs,
          hint: 'Purchase orders prepared but not yet sent.',
          href: '/purchase-orders',
        },
        {
          key: 'open_pos',
          label: 'Open POs',
          value: openPOs,
          hint: 'Orders currently waiting for supplier delivery.',
          href: '/purchase-orders',
        },
        {
          key: 'overdue_receipts',
          label: 'Overdue receipts',
          value: purchaseMetrics.overdueReceiptLines,
          hint: 'Receipt lines overdue against expected date.',
          href: '/purchase-orders',
        },
        {
          key: 'missing_vendor',
          label: 'Missing vendor',
          value: itemsWithoutPreferredVendor,
          hint: 'Procured items without preferred vendor setup.',
          href: '/suppliers',
        },
        {
          key: 'pending_receipts',
          label: 'Pending receipts',
          value: purchaseMetrics.pendingReceiptLines,
          hint: 'Open purchase lines still awaiting quantity.',
          href: '/purchase-orders',
        },
        {
          key: 'pending_invoices',
          label: 'Pending invoices',
          value: 0,
          hint: 'Reserved for future purchasing-invoice workflow.',
          href: null,
        },
      ],
    };
  }

  private async getReservedStockQuantity(): Promise<number> {
    const [materialBookings, shipmentPicks] = await Promise.all([
      this.prisma.materialBooking.findMany({
        where: {
          consumedAt: null,
        },
        select: {
          quantity: true,
        },
      }),
      this.prisma.shipmentPick.findMany({
        where: {
          shipmentLine: {
            shipment: {
              status: {
                in: ['draft', 'picked'],
              },
            },
          },
        },
        select: {
          quantity: true,
        },
      }),
    ]);

    const materialReserved = materialBookings.reduce(
      (sum, booking) => sum + booking.quantity,
      0,
    );
    const shipmentReserved = shipmentPicks.reduce((sum, pick) => sum + pick.quantity, 0);

    return materialReserved + shipmentReserved;
  }

  private async getPurchaseReceiptMetrics(): Promise<{
    pendingReceiptLines: number;
    overdueReceiptLines: number;
    expectedReceiptLines: number;
  }> {
    const purchaseOrderLines = await this.prisma.purchaseOrderLine.findMany({
      include: {
        purchaseOrder: {
          select: {
            id: true,
            status: true,
            expectedDate: true,
          },
        },
      },
    });

    if (purchaseOrderLines.length === 0) {
      return {
        pendingReceiptLines: 0,
        overdueReceiptLines: 0,
        expectedReceiptLines: 0,
      };
    }

    const lineIds = purchaseOrderLines.map((line) => line.id);
    const receipts = await this.prisma.inventoryTransaction.findMany({
      where: {
        purchaseOrderLineId: {
          in: lineIds,
        },
        transactionType: {
          in: ['receive', 'purchase_receipt'],
        },
      },
      select: {
        purchaseOrderLineId: true,
        quantity: true,
      },
    });

    const receivedByLine = new Map<number, number>();
    for (const receipt of receipts) {
      if (receipt.purchaseOrderLineId === null) {
        continue;
      }

      receivedByLine.set(
        receipt.purchaseOrderLineId,
        (receivedByLine.get(receipt.purchaseOrderLineId) ?? 0) + receipt.quantity,
      );
    }

    let pendingReceiptLines = 0;
    let overdueReceiptLines = 0;
    let expectedReceiptLines = 0;
    const now = new Date();

    for (const line of purchaseOrderLines) {
      const purchaseOrderStatus = line.purchaseOrder.status;
      if (!['open', 'partial', 'draft'].includes(purchaseOrderStatus)) {
        continue;
      }

      const receivedQuantity = receivedByLine.get(line.id) ?? 0;
      const remainingQuantity = Math.max(line.quantity - receivedQuantity, 0);

      if (remainingQuantity <= 0) {
        continue;
      }

      pendingReceiptLines += 1;

      if (purchaseOrderStatus === 'open' || purchaseOrderStatus === 'partial') {
        expectedReceiptLines += 1;
      }

      if (
        line.purchaseOrder.expectedDate &&
        line.purchaseOrder.expectedDate.getTime() < now.getTime() &&
        (purchaseOrderStatus === 'open' || purchaseOrderStatus === 'partial')
      ) {
        overdueReceiptLines += 1;
      }
    }

    return {
      pendingReceiptLines,
      overdueReceiptLines,
      expectedReceiptLines,
    };
  }

  private buildSummary(salesOrders: SalesOrderDashboardRecord[]): OrderStatusDashboardSummaryDto {
    const summary: OrderStatusDashboardSummaryDto = {
      totalOrders: salesOrders.length,
      draftCount: 0,
      confirmedCount: 0,
      releasedCount: 0,
      inProductionCount: 0,
      shippedCount: 0,
      invoicedCount: 0,
      closedCount: 0,
    };

    for (const salesOrder of salesOrders) {
      const summaryKey = this.resolveSummaryKey(salesOrder.status);
      if (summaryKey) {
        summary[summaryKey] += 1;
      }
    }

    return summary;
  }

  private mapOrder(salesOrder: SalesOrderDashboardRecord): OrderStatusDashboardRowDto {
    const lineCount = salesOrder.salesOrderLines.length;
    const orderedQuantity = salesOrder.salesOrderLines.reduce(
      (total, line) => total + line.quantity,
      0,
    );
    const workOrders = salesOrder.salesOrderLines.flatMap((line) =>
      line.workOrder ? [line.workOrder] : [],
    );
    const operations = workOrders.flatMap((workOrder) => workOrder.workOrderOperations);
    const openOperationCount = operations.filter((operation) =>
      ['queued', 'ready', 'running', 'paused'].includes(operation.status),
    ).length;
    const completedOperationCount = operations.filter(
      (operation) => operation.status === 'completed',
    ).length;
    const pendingInspectionCount = operations.filter(
      (operation) =>
        operation.status === 'completed' &&
        (!operation.inspection || operation.inspection.status === 'pending'),
    ).length;
    const qualityClearedQuantity = workOrders.reduce(
      (total, workOrder) =>
        total + this.calculateQualityClearedQuantity(workOrder.workOrderOperations),
      0,
    );

    return {
      salesOrderId: salesOrder.id,
      quoteId: salesOrder.quoteId,
      customerId: salesOrder.customerId,
      customerName: salesOrder.customer.name,
      salesOrderStatus: salesOrder.status,
      lineCount,
      orderedQuantity,
      workOrdersGenerated: workOrders.length,
      workOrdersExpected: lineCount,
      openOperationCount,
      completedOperationCount,
      pendingInspectionCount,
      qualityClearedQuantity,
      shipmentCounts: this.buildShipmentCounts(salesOrder),
      invoiceCounts: this.buildInvoiceCounts(salesOrder),
      createdAt: salesOrder.createdAt,
      updatedAt: salesOrder.updatedAt,
    };
  }

  private buildProductionSummary(
    workOrders: ProductionDashboardWorkOrderRecord[],
    rows: ProductionPerformanceDashboardRowDto[],
  ): ProductionPerformanceDashboardSummaryDto {
    const summary: ProductionPerformanceDashboardSummaryDto = {
      totalWorkOrders: workOrders.length,
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
    };

    for (const workOrder of workOrders) {
      const summaryKey = this.resolveWorkOrderSummaryKey(workOrder.status);
      if (summaryKey) {
        summary[summaryKey] += 1;
      }
    }

    for (const row of rows) {
      summary.totalOperations += row.operationCount;
      summary.queuedOperations += row.queuedOperationCount;
      summary.readyOperations += row.readyOperationCount;
      summary.runningOperations += row.runningOperationCount;
      summary.pausedOperations += row.pausedOperationCount;
      summary.completedOperations += row.completedOperationCount;
      summary.pendingInspections += row.pendingInspectionCount;
      summary.passedInspections += row.passedInspectionCount;
      summary.failedInspections += row.failedInspectionCount;
      summary.reworkRequiredInspections += row.reworkRequiredInspectionCount;
      summary.totalPlannedQuantity += row.plannedQuantity;
      summary.totalRecordedQuantity += row.recordedProductionQuantity;
      summary.totalScrappedQuantity += row.scrappedQuantity;
    }

    return summary;
  }

  private mapProductionWorkOrder(
    workOrder: ProductionDashboardWorkOrderRecord,
  ): ProductionPerformanceDashboardRowDto {
    const operationStatusCounts = this.buildOperationStatusCounts(workOrder.workOrderOperations);
    const inspectionStatusCounts = this.buildInspectionStatusCounts(workOrder.workOrderOperations);
    const recordedProductionQuantity = workOrder.workOrderOperations.reduce(
      (total, operation) =>
        total +
        operation.productionLogs.reduce((operationTotal, log) => operationTotal + log.quantity, 0),
      0,
    );
    const qualityPassedQuantity = workOrder.workOrderOperations.reduce(
      (total, operation) => total + (operation.inspection?.passedQuantity ?? 0),
      0,
    );
    const qualityFailedQuantity = workOrder.workOrderOperations.reduce(
      (total, operation) => total + (operation.inspection?.failedQuantity ?? 0),
      0,
    );
    const qualityReworkQuantity = workOrder.workOrderOperations.reduce(
      (total, operation) => total + (operation.inspection?.reworkQuantity ?? 0),
      0,
    );
    const scrappedQuantity = workOrder.workOrderOperations.reduce(
      (total, operation) => total + (operation.inspection?.scrappedQuantity ?? 0),
      0,
    );

    return {
      workOrderId: workOrder.id,
      salesOrderId: workOrder.salesOrderLine.salesOrderId,
      salesOrderLineId: workOrder.salesOrderLineId,
      itemId: workOrder.salesOrderLine.itemId,
      itemName: workOrder.salesOrderLine.item.name,
      customerId: workOrder.salesOrderLine.salesOrder.customerId,
      customerName: workOrder.salesOrderLine.salesOrder.customer.name,
      workOrderStatus: workOrder.status,
      plannedQuantity: workOrder.quantity,
      operationCount: workOrder.workOrderOperations.length,
      queuedOperationCount: operationStatusCounts.queued,
      readyOperationCount: operationStatusCounts.ready,
      runningOperationCount: operationStatusCounts.running,
      pausedOperationCount: operationStatusCounts.paused,
      completedOperationCount: operationStatusCounts.completed,
      pendingInspectionCount: inspectionStatusCounts.pending,
      passedInspectionCount: inspectionStatusCounts.passed,
      failedInspectionCount: inspectionStatusCounts.failed,
      reworkRequiredInspectionCount: inspectionStatusCounts.reworkRequired,
      recordedProductionQuantity,
      qualityPassedQuantity,
      qualityFailedQuantity,
      qualityReworkQuantity,
      scrappedQuantity,
      createdAt: workOrder.createdAt,
      updatedAt: workOrder.updatedAt,
    };
  }

  private buildInventorySummary(
    rows: InventorySummaryReportRowDto[],
  ): InventorySummaryReportSummaryDto {
    const summary: InventorySummaryReportSummaryDto = {
      totalTrackedItems: 0,
      totalOnHandQuantity: 0,
      totalReceivedQuantity: 0,
      totalIssuedQuantity: 0,
      totalAdjustmentQuantity: 0,
      totalReturnedQuantity: 0,
      totalPurchaseOrderedQuantity: 0,
      totalPurchaseReceivedQuantity: 0,
      totalPurchaseOpenQuantity: 0,
    };

    for (const row of rows) {
      summary.totalTrackedItems += 1;
      summary.totalOnHandQuantity += row.quantityOnHand;
      summary.totalReceivedQuantity += row.receivedQuantity;
      summary.totalIssuedQuantity += row.issuedQuantity;
      summary.totalAdjustmentQuantity += row.adjustmentQuantity;
      summary.totalReturnedQuantity += row.returnedQuantity;
      summary.totalPurchaseOrderedQuantity += row.purchaseOrderedQuantity;
      summary.totalPurchaseReceivedQuantity += row.purchaseReceivedQuantity;
      summary.totalPurchaseOpenQuantity += row.purchaseOpenQuantity;
    }

    return summary;
  }

  private mapInventorySummaryItem(
    inventoryItem: InventorySummaryReportItemRecord,
  ): InventorySummaryReportRowDto {
    const transactionTotals = this.buildInventoryTransactionTotals(
      inventoryItem.inventoryTransactions,
    );
    const receivedByPurchaseOrderLine = this.buildReceivedQuantitiesByPurchaseOrderLine(
      inventoryItem.inventoryTransactions,
    );
    const purchaseOrderedQuantity = inventoryItem.item.purchaseOrderLines.reduce(
      (total, line) => total + line.quantity,
      0,
    );
    const purchaseReceivedQuantity = inventoryItem.item.purchaseOrderLines.reduce(
      (total, line) => total + (receivedByPurchaseOrderLine.get(line.id) ?? 0),
      0,
    );
    const purchaseOpenQuantity = inventoryItem.item.purchaseOrderLines.reduce((total, line) => {
      const lineReceivedQuantity = receivedByPurchaseOrderLine.get(line.id) ?? 0;
      return total + Math.max(line.quantity - lineReceivedQuantity, 0);
    }, 0);

    return {
      inventoryItemId: inventoryItem.id,
      itemId: inventoryItem.itemId,
      itemName: inventoryItem.item.name,
      quantityOnHand: inventoryItem.quantityOnHand,
      receivedQuantity: transactionTotals.receivedQuantity,
      issuedQuantity: transactionTotals.issuedQuantity,
      adjustmentQuantity: transactionTotals.adjustmentQuantity,
      returnedQuantity: transactionTotals.returnedQuantity,
      purchaseOrderedQuantity,
      purchaseReceivedQuantity,
      purchaseOpenQuantity,
      createdAt: inventoryItem.createdAt,
      updatedAt: inventoryItem.updatedAt,
    };
  }

  private buildSalesReportSummary(rows: SalesReportRowDto[]): SalesReportSummaryDto {
    const summary: SalesReportSummaryDto = {
      totalSalesOrders: 0,
      totalOrderedQuantity: 0,
      totalOrderedAmount: 0,
      totalShippedQuantity: 0,
      totalShippedAmount: 0,
      totalInvoiceIssuedAmount: 0,
      totalInvoicePaidAmount: 0,
      totalOutstandingInvoiceAmount: 0,
    };

    for (const row of rows) {
      summary.totalSalesOrders += 1;
      summary.totalOrderedQuantity += row.orderedQuantity;
      summary.totalOrderedAmount += row.orderedAmount;
      summary.totalShippedQuantity += row.shippedQuantity;
      summary.totalShippedAmount += row.shippedAmount;
      summary.totalInvoiceIssuedAmount += row.invoiceIssuedAmount;
      summary.totalInvoicePaidAmount += row.invoicePaidAmount;
      summary.totalOutstandingInvoiceAmount += row.outstandingInvoiceAmount;
    }

    return summary;
  }

  private mapSalesReportOrder(salesOrder: SalesReportOrderRecord): SalesReportRowDto {
    const orderedQuantity = salesOrder.salesOrderLines.reduce((total, line) => total + line.quantity, 0);
    const orderedAmount = salesOrder.salesOrderLines.reduce((total, line) => total + line.lineTotal, 0);
    let shippedQuantity = 0;
    let shippedAmount = 0;
    let deliveredShipmentCount = 0;
    let invoiceIssuedCount = 0;
    let invoicePaidCount = 0;
    let invoiceIssuedAmount = 0;
    let invoicePaidAmount = 0;

    for (const shipment of salesOrder.shipments) {
      if (shipment.status === 'delivered') {
        deliveredShipmentCount += 1;
      }

      if (shipment.status === 'shipped' || shipment.status === 'delivered') {
        for (const shipmentLine of shipment.shipmentLines) {
          shippedQuantity += shipmentLine.quantity;
          shippedAmount += shipmentLine.quantity * shipmentLine.salesOrderLine.unitPrice;
        }
      }

      if (shipment.invoice) {
        const invoiceTotal = this.calculateSalesInvoiceTotal(shipment.invoice);

        if (shipment.invoice.status === 'issued') {
          invoiceIssuedCount += 1;
          invoiceIssuedAmount += invoiceTotal;
        }

        if (shipment.invoice.status === 'paid') {
          invoicePaidCount += 1;
          invoicePaidAmount += invoiceTotal;
        }
      }
    }

    return {
      salesOrderId: salesOrder.id,
      quoteId: salesOrder.quoteId,
      customerId: salesOrder.customerId,
      customerName: salesOrder.customer.name,
      salesOrderStatus: salesOrder.status,
      orderedQuantity,
      orderedAmount,
      shippedQuantity,
      shippedAmount,
      invoiceIssuedAmount,
      invoicePaidAmount,
      outstandingInvoiceAmount: invoiceIssuedAmount,
      shipmentCount: salesOrder.shipments.length,
      deliveredShipmentCount,
      invoiceIssuedCount,
      invoicePaidCount,
      createdAt: salesOrder.createdAt,
      updatedAt: salesOrder.updatedAt,
    };
  }

  private calculateQualityClearedQuantity(
    operations: WorkOrderOperations,
  ): number {
    if (operations.length === 0) {
      return 0;
    }

    const highestSequence = operations.reduce(
      (currentMax, operation) =>
        currentMax === null || operation.sequence > currentMax ? operation.sequence : currentMax,
      null as number | null,
    );

    if (highestSequence === null) {
      return 0;
    }

    return operations
      .filter((operation) => operation.sequence === highestSequence)
      .reduce((total, operation) => total + (operation.inspection?.passedQuantity ?? 0), 0);
  }

  private buildShipmentCounts(
    salesOrder: SalesOrderDashboardRecord,
  ): OrderStatusDashboardShipmentCountsDto {
    const counts: OrderStatusDashboardShipmentCountsDto = {
      draft: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
    };

    for (const shipment of salesOrder.shipments) {
      if (SHIPMENT_STATUSES.includes(shipment.status as ShipmentStatus)) {
        counts[shipment.status as ShipmentStatus] += 1;
      }
    }

    return counts;
  }

  private buildOperationStatusCounts(operations: ProductionDashboardOperationRecord[]): {
    queued: number;
    ready: number;
    running: number;
    paused: number;
    completed: number;
  } {
    return operations.reduce(
      (counts, operation) => {
        if (operation.status === 'queued') {
          counts.queued += 1;
        }
        if (operation.status === 'ready') {
          counts.ready += 1;
        }
        if (operation.status === 'running') {
          counts.running += 1;
        }
        if (operation.status === 'paused') {
          counts.paused += 1;
        }
        if (operation.status === 'completed') {
          counts.completed += 1;
        }
        return counts;
      },
      {
        queued: 0,
        ready: 0,
        running: 0,
        paused: 0,
        completed: 0,
      },
    );
  }

  private buildInspectionStatusCounts(operations: ProductionDashboardOperationRecord[]): {
    pending: number;
    passed: number;
    failed: number;
    reworkRequired: number;
  } {
    return operations.reduce(
      (counts, operation) => {
        if (!operation.inspection) {
          return counts;
        }

        if (operation.inspection.status === 'pending') {
          counts.pending += 1;
        }
        if (operation.inspection.status === 'passed') {
          counts.passed += 1;
        }
        if (operation.inspection.status === 'failed') {
          counts.failed += 1;
        }
        if (operation.inspection.status === 'rework_required') {
          counts.reworkRequired += 1;
        }
        return counts;
      },
      {
        pending: 0,
        passed: 0,
        failed: 0,
        reworkRequired: 0,
      },
    );
  }

  private buildInventoryTransactionTotals(transactions: InventorySummaryReportTransactionRecord[]): {
    receivedQuantity: number;
    issuedQuantity: number;
    adjustmentQuantity: number;
    returnedQuantity: number;
  } {
    return transactions.reduce(
      (totals, transaction) => {
        if (transaction.transactionType === 'receive') {
          totals.receivedQuantity += transaction.quantity;
        }
        if (transaction.transactionType === 'issue') {
          totals.issuedQuantity += transaction.quantity;
        }
        if (transaction.transactionType === 'adjustment') {
          totals.adjustmentQuantity += transaction.quantity;
        }
        if (transaction.transactionType === 'return') {
          totals.returnedQuantity += transaction.quantity;
        }
        return totals;
      },
      {
        receivedQuantity: 0,
        issuedQuantity: 0,
        adjustmentQuantity: 0,
        returnedQuantity: 0,
      },
    );
  }

  private buildReceivedQuantitiesByPurchaseOrderLine(
    transactions: InventorySummaryReportTransactionRecord[],
  ): Map<number, number> {
    const receivedByLine = new Map<number, number>();

    for (const transaction of transactions) {
      if (transaction.transactionType !== 'receive' || transaction.purchaseOrderLineId === null) {
        continue;
      }

      const current = receivedByLine.get(transaction.purchaseOrderLineId) ?? 0;
      receivedByLine.set(transaction.purchaseOrderLineId, current + transaction.quantity);
    }

    return receivedByLine;
  }

  private calculateSalesInvoiceTotal(invoice: SalesReportInvoiceRecord): number {
    return invoice.invoiceLines.reduce((total, line) => total + line.lineTotal, 0);
  }

  private buildInvoiceCounts(
    salesOrder: SalesOrderDashboardRecord,
  ): OrderStatusDashboardInvoiceCountsDto {
    const counts: OrderStatusDashboardInvoiceCountsDto = {
      issued: 0,
      paid: 0,
    };

    for (const shipment of salesOrder.shipments) {
      if (shipment.invoice && INVOICE_STATUSES.includes(shipment.invoice.status as InvoiceStatus)) {
        counts[shipment.invoice.status as InvoiceStatus] += 1;
      }
    }

    return counts;
  }

  private resolveSummaryKey(status: string): keyof OrderStatusDashboardSummaryDto | null {
    return SALES_ORDER_STATUS_TO_SUMMARY_KEY[status] ?? null;
  }

  private resolveWorkOrderSummaryKey(
    status: string,
  ): ProductionWorkOrderStatusSummaryKey | null {
    return WORK_ORDER_STATUS_TO_SUMMARY_KEY[status] ?? null;
  }
}
