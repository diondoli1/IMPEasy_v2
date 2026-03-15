import { OrderStatusDashboardInvoiceCountsDto } from './order-status-dashboard-invoice-counts.dto';
import { OrderStatusDashboardShipmentCountsDto } from './order-status-dashboard-shipment-counts.dto';

export class OrderStatusDashboardRowDto {
  salesOrderId!: number;
  quoteId!: number;
  customerId!: number;
  customerName!: string;
  salesOrderStatus!: string;
  lineCount!: number;
  orderedQuantity!: number;
  workOrdersGenerated!: number;
  workOrdersExpected!: number;
  openOperationCount!: number;
  completedOperationCount!: number;
  pendingInspectionCount!: number;
  qualityClearedQuantity!: number;
  shipmentCounts!: OrderStatusDashboardShipmentCountsDto;
  invoiceCounts!: OrderStatusDashboardInvoiceCountsDto;
  createdAt!: Date;
  updatedAt!: Date;
}
