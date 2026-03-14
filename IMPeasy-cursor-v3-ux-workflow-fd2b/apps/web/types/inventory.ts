export type InventoryItem = {
  id: number;
  itemId: number;
  quantityOnHand: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItemInput = {
  itemId: number;
  quantityOnHand?: number;
};

export type InventoryTransaction = {
  id: number;
  inventoryItemId: number;
  itemId: number;
  stockLotId?: number | null;
  referenceType?: string | null;
  referenceId?: number | null;
  referenceNumber?: string | null;
  purchaseOrderLineId: number | null;
  transactionType: string;
  quantity: number;
  transactionDate?: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaterialIssueInput = {
  quantity: number;
  notes?: string;
};

export type InventoryAdjustmentInput = {
  delta: number;
  notes?: string;
};

export type InventorySummaryReportSummary = {
  totalTrackedItems: number;
  totalOnHandQuantity: number;
  totalReceivedQuantity: number;
  totalIssuedQuantity: number;
  totalAdjustmentQuantity: number;
  totalReturnedQuantity: number;
  totalPurchaseOrderedQuantity: number;
  totalPurchaseReceivedQuantity: number;
  totalPurchaseOpenQuantity: number;
};

export type InventorySummaryReportRow = {
  inventoryItemId: number;
  itemId: number;
  itemName: string;
  quantityOnHand: number;
  receivedQuantity: number;
  issuedQuantity: number;
  adjustmentQuantity: number;
  returnedQuantity: number;
  purchaseOrderedQuantity: number;
  purchaseReceivedQuantity: number;
  purchaseOpenQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type InventorySummaryReportResponse = {
  summary: InventorySummaryReportSummary;
  items: InventorySummaryReportRow[];
};

export type StockMovement = {
  id: number;
  itemId: number;
  itemCode: string | null;
  itemName: string;
  stockLotId: number | null;
  lotNumber: string | null;
  movementType: string;
  quantity: number;
  reference: string | null;
  transactionDate: string;
  notes: string | null;
};

export type StockLotReservation = {
  kind: string;
  reference: string;
  quantity: number;
};

export type StockLot = {
  id: number;
  itemId: number;
  itemCode: string | null;
  itemName: string;
  lotNumber: string;
  sourceDocument: string | null;
  receivedOrProducedAt: string | null;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  status: string;
  notes: string | null;
};

export type StockLotDetail = StockLot & {
  reservations: StockLotReservation[];
};

export type StockItem = {
  itemId: number;
  itemCode: string | null;
  itemName: string;
  itemGroup: string | null;
  productGroupCode: string | null;
  unitOfMeasure: string;
  onHandQuantity: number;
  availableQuantity: number;
  bookedQuantity: number;
  expectedQuantity: number;
  wipQuantity: number;
  reorderPoint: number;
  defaultPrice: number;
};

export type LinkedStockDocument = {
  kind: string;
  reference: string;
};

export type StockItemDetail = StockItem & {
  lots: StockLot[];
  movements: StockMovement[];
  linkedDocuments: LinkedStockDocument[];
};

export type CriticalOnHandItem = {
  itemId: number;
  itemCode: string | null;
  itemName: string;
  onHandQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  shortageState: string;
};
