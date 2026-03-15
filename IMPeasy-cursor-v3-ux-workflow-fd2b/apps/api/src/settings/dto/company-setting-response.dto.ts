export class CompanySettingResponseDto {
  id!: number;
  companyName!: string;
  legalName!: string | null;
  address!: string | null;
  phone!: string | null;
  email!: string | null;
  website!: string | null;
  taxNumber!: string | null;
  taxRate!: number | null;
  createdAt!: Date;
  updatedAt!: Date;
}
