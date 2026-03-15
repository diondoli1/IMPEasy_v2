export class SupplierResponseDto {
  id!: number;
  code!: string | null;
  name!: string;
  email!: string | null;
  phone!: string | null;
  paymentTerm!: string | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
