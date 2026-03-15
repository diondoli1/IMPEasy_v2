export class PurchaseReceiptResponseDto {
  id!: number;
  purchaseOrderLineId!: number;
  stockLotId!: number | null;
  lotNumber!: string | null;
  quantity!: number;
  receiptDate!: Date;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
