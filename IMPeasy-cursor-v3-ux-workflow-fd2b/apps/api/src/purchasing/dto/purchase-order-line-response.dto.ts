export class PurchaseOrderLineResponseDto {
  id!: number;
  purchaseOrderId!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  quantity!: number;
  unitPrice!: number;
  lineTotal!: number;
  receivedQuantity!: number;
  remainingQuantity!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
