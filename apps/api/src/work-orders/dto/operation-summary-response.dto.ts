export class OperationSummaryResponseDto {
  id!: number;
  routingOperationId!: number;
  sequence!: number;
  operationName!: string;
  description!: string | null;
  workstation!: string | null;
  assignedOperatorId!: number | null;
  assignedOperatorName!: string | null;
  status!: string;
  plannedQuantity!: number;
  goodQuantity!: number | null;
  scrapQuantity!: number | null;
  completionSummary!: string | null;
}
