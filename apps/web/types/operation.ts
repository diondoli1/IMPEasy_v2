export type OperationQueueEntry = {
  id: number;
  workOrderId: number;
  workOrderNumber: string;
  salesOrderId: number;
  salesOrderLineId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  routingOperationId: number;
  operationName: string;
  workstation: string | null;
  assignedOperatorId: number | null;
  assignedOperatorName: string | null;
  sequence: number;
  plannedQuantity: number;
  status: string;
};

export type OperationDetail = {
  id: number;
  workOrderId: number;
  workOrderNumber: string;
  salesOrderId: number;
  salesOrderLineId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  routingId: number;
  routingName: string;
  routingOperationId: number;
  operationName: string;
  workstation: string | null;
  assignedOperatorId: number | null;
  assignedOperatorName: string | null;
  sequence: number;
  plannedQuantity: number;
  goodQuantity: number | null;
  scrapQuantity: number | null;
  status: string;
  reworkSourceOperationId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductionLog = {
  id: number;
  operationId: number;
  quantity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductionLogInput = {
  quantity: number;
  notes?: string;
};

export type OperationCompletionInput = {
  goodQuantity?: number;
  scrapQuantity?: number;
};

export type OperationUpdateInput = {
  assignedOperatorId?: number;
};
