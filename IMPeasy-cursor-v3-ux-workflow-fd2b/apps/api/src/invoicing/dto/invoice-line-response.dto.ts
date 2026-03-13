export class InvoiceLineResponseDto {
  id!: number;
  invoiceId!: number;
  shipmentLineId!: number;
  salesOrderLineId!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  quantity!: number;
  unitPrice!: number;
  lineTotal!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
