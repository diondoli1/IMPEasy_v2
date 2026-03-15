import { ContactResponseDto } from './contact-response.dto';
import { CustomerAddressDto } from './customer-address.dto';

export class CustomerDocumentSummaryDto {
  kind!: 'quote' | 'sales_order';
  id!: number;
  documentNumber!: string;
  status!: string;
  promisedDate!: Date | null;
  totalAmount!: number;
  updatedAt!: Date;
}

export class CustomerResponseDto {
  id!: number;
  code!: string | null;
  name!: string;
  status!: string | null;
  regNo!: string | null;
  email!: string | null;
  phone!: string | null;
  vatNumber!: string | null;
  contactStarted!: Date | null;
  nextContact!: Date | null;
  website!: string | null;
  billingAddress!: CustomerAddressDto;
  shippingAddress!: CustomerAddressDto;
  defaultPaymentTerm!: string | null;
  defaultShippingTerm!: string | null;
  defaultShippingMethod!: string | null;
  defaultDocumentDiscountPercent!: number;
  defaultTaxRate!: number;
  internalNotes!: string | null;
  isActive!: boolean;
  contacts!: ContactResponseDto[];
  documents!: CustomerDocumentSummaryDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
