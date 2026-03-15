export class ItemVendorTermResponseDto {
  id!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  supplierId!: number;
  supplierCode!: string | null;
  supplierName!: string;
  vendorItemCode!: string | null;
  leadTimeDays!: number;
  unitPrice!: number;
  minimumQuantity!: number;
  isPreferred!: boolean;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
