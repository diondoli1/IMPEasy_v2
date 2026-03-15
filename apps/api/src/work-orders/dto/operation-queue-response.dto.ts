export class OperationQueueResponseDto {
  id!: number;
  workOrderId!: number;
  workOrderNumber!: string;
  salesOrderId!: number;
  salesOrderLineId!: number;
  itemId!: number;
  itemCode!: string;
  itemName!: string;
  routingOperationId!: number;
  operationName!: string;
  workstation!: string | null;
  assignedOperatorId!: number | null;
  assignedOperatorName!: string | null;
  sequence!: number;
  plannedQuantity!: number;
  status!: string;
}
