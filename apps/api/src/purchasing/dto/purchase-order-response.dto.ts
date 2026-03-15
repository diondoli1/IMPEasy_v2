export class PurchaseOrderResponseDto {
  id!: number;
  number!: string;
  supplierId!: number;
  supplierCode!: string | null;
  supplierName!: string;
  status!: string;
  supplierReference!: string | null;
  orderDate!: Date;
  expectedDate!: Date | null;
  buyer!: string | null;
  currency!: string;
  paymentTerm!: string | null;
  openQuantity!: number;
  receivedQuantity!: number;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
