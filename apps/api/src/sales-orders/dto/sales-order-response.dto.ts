export class SalesOrderResponseDto {
  id!: number;
  quoteId!: number;
  customerId!: number;
  customerName!: string;
  customerCode!: string | null;
  documentNumber!: string;
  status!: string;
  orderDate!: Date;
  promisedDate!: Date | null;
  customerReference!: string | null;
  salespersonName!: string | null;
  salespersonEmail!: string | null;
  paymentTerm!: string | null;
  shippingTerm!: string | null;
  shippingMethod!: string | null;
  taxMode!: string;
  documentDiscountPercent!: number;
  notes!: string | null;
  internalNotes!: string | null;
  contactName!: string | null;
  contactEmail!: string | null;
  contactPhone!: string | null;
  billingAddress!: {
    street: string | null;
    city: string | null;
    postcode: string | null;
    stateRegion: string | null;
    country: string | null;
  };
  shippingAddress!: {
    street: string | null;
    city: string | null;
    postcode: string | null;
    stateRegion: string | null;
    country: string | null;
  };
  subtotalAmount!: number;
  discountAmount!: number;
  taxAmount!: number;
  totalAmount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
