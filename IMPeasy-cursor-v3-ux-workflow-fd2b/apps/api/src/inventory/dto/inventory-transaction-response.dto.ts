export class InventoryTransactionResponseDto {
  id!: number;
  inventoryItemId!: number;
  itemId!: number;
  purchaseOrderLineId!: number | null;
  transactionType!: string;
  quantity!: number;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
