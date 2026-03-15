export type ShipmentLine = {
  id: number;
  shipmentId: number;
  salesOrderLineId: number;
  itemId: number;
  itemCode: string | null;
  itemName: string;
  quantity: number;
  pickedQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type Shipment = {
  id: number;
  number: string;
  salesOrderId: number;
  salesOrderNumber: string;
  customerId: number;
  customerName: string;
  status: string;
  shipDate: string | null;
  carrierMethod: string | null;
  trackingNumber: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  shipmentLines: ShipmentLine[];
};

export type ShippingAvailabilityLine = {
  salesOrderLineId: number;
  itemId: number;
  itemCode: string | null;
  itemName: string;
  orderedQuantity: number;
  shippedQuantity: number;
  remainingQuantity: number;
  availableStockQuantity: number;
  qualityClearedQuantity: number;
  availableToShipQuantity: number;
  pendingQualityQuantity: number;
  blockedReason: string | null;
};

export type ShipmentPick = {
  id: number;
  shipmentLineId: number;
  stockLotId: number;
  lotNumber: string;
  quantity: number;
  pickedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentLineDetail = ShipmentLine & {
  availableLots: import('./inventory').StockLot[];
  picks: ShipmentPick[];
};

export type ShipmentHistoryEntry = {
  eventType: string;
  message: string;
  eventDate: string;
};

export type ShipmentDetail = Shipment & {
  shipToName: string;
  shipToAddress: string[];
  invoice: import('./invoice').Invoice | null;
  lines: ShipmentLineDetail[];
  history: ShipmentHistoryEntry[];
};

export type ShipmentInputLine = {
  salesOrderLineId: number;
  quantity: number;
};

export type ShipmentInput = {
  salesOrderId: number;
  lines: ShipmentInputLine[];
  carrierMethod?: string;
  trackingNumber?: string;
  notes?: string;
};

export type ShipmentPickInput = {
  shipmentLineId: number;
  stockLotId: number;
  quantity: number;
  notes?: string;
};

export type ShipmentUpdateInput = {
  shipDate?: string;
  carrierMethod?: string;
  trackingNumber?: string;
  notes?: string;
};
