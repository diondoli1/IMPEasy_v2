import { ItemVendorTermResponseDto } from './item-vendor-term-response.dto';
import { PurchaseOrderResponseDto } from './purchase-order-response.dto';

export class SupplierDetailResponseDto {
  id!: number;
  code!: string | null;
  name!: string;
  email!: string | null;
  phone!: string | null;
  paymentTerm!: string | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  itemVendorTerms!: ItemVendorTermResponseDto[];
  purchaseOrders!: PurchaseOrderResponseDto[];
}
