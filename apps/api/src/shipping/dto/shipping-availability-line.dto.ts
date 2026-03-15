export class ShippingAvailabilityLineDto {
  salesOrderLineId!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  orderedQuantity!: number;
  shippedQuantity!: number;
  remainingQuantity!: number;
  availableStockQuantity!: number;
  blockedReason!: string | null;
}
