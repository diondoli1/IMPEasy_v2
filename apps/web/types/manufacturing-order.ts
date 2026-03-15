export type MaterialBooking = {
  id: number;
  bomItemId: number;
  stockLotId: number;
  lotNumber: string;
  quantity: number;
  consumedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaterialRequirementAvailableLot = {
  id: number;
  lotNumber: string;
  availableQuantity: number;
};

export type MaterialRequirement = {
  bomItemId: number;
  rowOrder: number;
  componentItemId: number;
  componentItemCode: string;
  componentItemName: string;
  unitOfMeasure: string;
  requiredQuantity: number;
  bookedQuantity: number;
  availableQuantity: number;
  notes: string | null;
  bookings: MaterialBooking[];
  availableLots: MaterialRequirementAvailableLot[];
};

export type ManufacturingOperationSummary = {
  id: number;
  routingOperationId: number;
  sequence: number;
  operationName: string;
  description: string | null;
  workstation: string | null;
  assignedOperatorId: number | null;
  assignedOperatorName: string | null;
  status: string;
  plannedQuantity: number;
  goodQuantity: number | null;
  scrapQuantity: number | null;
  completionSummary: string | null;
};

export type ManufacturingOrderHistoryEntry = {
  id: number;
  eventType: string;
  actor: string;
  message: string;
  createdAt: string;
};

export type ManufacturingOrder = {
  id: number;
  documentNumber: string;
  salesOrderId: number;
  salesOrderNumber: string;
  salesOrderLineId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  customerId: number;
  customerName: string;
  bomId: number | null;
  bomName: string | null;
  routingId: number;
  routingName: string;
  quantity: number;
  dueDate: string | null;
  status: string;
  releaseState: string;
  currentOperationId: number | null;
  currentOperationName: string | null;
  currentWorkstation: string | null;
  assignedOperatorId: number | null;
  assignedOperatorName: string | null;
  assignedWorkstation: string | null;
  bookingCompletenessPercent: number;
  finishedGoodsLotNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManufacturingOrderDetail = ManufacturingOrder & {
  notes: string | null;
  producedQuantity: number;
  scrapQuantity: number;
  finishedGoodsLotId: number | null;
  materials: MaterialRequirement[];
  operations: ManufacturingOperationSummary[];
  history: ManufacturingOrderHistoryEntry[];
};

export type ManufacturingOrderInput = {
  dueDate?: string;
  assignedOperatorId?: number;
  assignedWorkstation?: string;
  notes?: string;
};

export type MaterialBookingInput = {
  bomItemId: number;
  stockLotId: number;
  quantity: number;
};

export type MaterialBookingUpdateInput = {
  quantity: number;
};
