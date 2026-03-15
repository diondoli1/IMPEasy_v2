export class OrderStatusDashboardSummaryDto {
  totalOrders!: number;
  draftCount!: number;
  confirmedCount!: number;
  releasedCount!: number;
  inProductionCount!: number;
  shippedCount!: number;
  invoicedCount!: number;
  closedCount!: number;
}
