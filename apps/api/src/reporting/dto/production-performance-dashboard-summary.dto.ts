export class ProductionPerformanceDashboardSummaryDto {
  totalWorkOrders!: number;
  plannedWorkOrders!: number;
  releasedWorkOrders!: number;
  inProgressWorkOrders!: number;
  completedWorkOrders!: number;
  closedWorkOrders!: number;
  totalOperations!: number;
  queuedOperations!: number;
  readyOperations!: number;
  runningOperations!: number;
  pausedOperations!: number;
  completedOperations!: number;
  pendingInspections!: number;
  passedInspections!: number;
  failedInspections!: number;
  reworkRequiredInspections!: number;
  totalPlannedQuantity!: number;
  totalRecordedQuantity!: number;
  totalScrappedQuantity!: number;
}
