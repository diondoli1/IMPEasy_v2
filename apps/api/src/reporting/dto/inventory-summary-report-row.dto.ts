export class InventorySummaryReportRowDto {
  inventoryItemId!: number;
  itemId!: number;
  itemName!: string;
  quantityOnHand!: number;
  receivedQuantity!: number;
  issuedQuantity!: number;
  adjustmentQuantity!: number;
  returnedQuantity!: number;
  purchaseOrderedQuantity!: number;
  purchaseReceivedQuantity!: number;
  purchaseOpenQuantity!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
