export class ProductionPerformanceDashboardRowDto {
  workOrderId!: number;
  salesOrderId!: number;
  salesOrderLineId!: number;
  itemId!: number;
  itemName!: string;
  customerId!: number;
  customerName!: string;
  workOrderStatus!: string;
  plannedQuantity!: number;
  operationCount!: number;
  queuedOperationCount!: number;
  readyOperationCount!: number;
  runningOperationCount!: number;
  pausedOperationCount!: number;
  completedOperationCount!: number;
  pendingInspectionCount!: number;
  passedInspectionCount!: number;
  failedInspectionCount!: number;
  reworkRequiredInspectionCount!: number;
  recordedProductionQuantity!: number;
  qualityPassedQuantity!: number;
  qualityFailedQuantity!: number;
  qualityReworkQuantity!: number;
  scrappedQuantity!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
