export class QuoteLineResponseDto {
  id!: number;
  quoteId!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string | null;
  description!: string | null;
  quantity!: number;
  unit!: string;
  unitPrice!: number;
  lineDiscountPercent!: number;
  taxRate!: number;
  deliveryDateOverride!: Date | null;
  lineTotal!: number;
  taxAmount!: number;
  totalAmount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
