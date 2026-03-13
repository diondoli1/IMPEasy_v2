export class OperationDetailResponseDto {
  id!: number;
  workOrderId!: number;
  workOrderNumber!: string;
  salesOrderId!: number;
  salesOrderLineId!: number;
  itemId!: number;
  itemCode!: string;
  itemName!: string;
  routingId!: number;
  routingName!: string;
  routingOperationId!: number;
  operationName!: string;
  workstation!: string | null;
  assignedOperatorId!: number | null;
  assignedOperatorName!: string | null;
  sequence!: number;
  plannedQuantity!: number;
  goodQuantity!: number | null;
  scrapQuantity!: number | null;
  status!: string;
  reworkSourceOperationId!: number | null;
  createdAt!: Date;
  updatedAt!: Date;
}
