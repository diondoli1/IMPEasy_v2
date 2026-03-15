export type WorkOrder = {
  id: number;
  salesOrderLineId: number;
  routingId: number;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkOrderDetail = WorkOrder & {
  salesOrderId: number;
  itemId: number;
};

export type ProductionPerformanceDashboardSummary = {
  totalWorkOrders: number;
  plannedWorkOrders: number;
  releasedWorkOrders: number;
  inProgressWorkOrders: number;
  completedWorkOrders: number;
  closedWorkOrders: number;
  totalOperations: number;
  queuedOperations: number;
  readyOperations: number;
  runningOperations: number;
  pausedOperations: number;
  completedOperations: number;
  pendingInspections: number;
  passedInspections: number;
  failedInspections: number;
  reworkRequiredInspections: number;
  totalPlannedQuantity: number;
  totalRecordedQuantity: number;
  totalScrappedQuantity: number;
};

export type ProductionPerformanceDashboardRow = {
  workOrderId: number;
  salesOrderId: number;
  salesOrderLineId: number;
  itemId: number;
  itemName: string;
  customerId: number;
  customerName: string;
  workOrderStatus: string;
  plannedQuantity: number;
  operationCount: number;
  queuedOperationCount: number;
  readyOperationCount: number;
  runningOperationCount: number;
  pausedOperationCount: number;
  completedOperationCount: number;
  pendingInspectionCount: number;
  passedInspectionCount: number;
  failedInspectionCount: number;
  reworkRequiredInspectionCount: number;
  recordedProductionQuantity: number;
  qualityPassedQuantity: number;
  qualityFailedQuantity: number;
  qualityReworkQuantity: number;
  scrappedQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductionPerformanceDashboardResponse = {
  summary: ProductionPerformanceDashboardSummary;
  workOrders: ProductionPerformanceDashboardRow[];
};
