import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceLineDto {
  @IsInt()
  @Min(1)
  salesOrderLineId!: number;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateInvoiceDto {
  @IsInt()
  @Min(1)
  salesOrderId!: number;

  @IsInt()
  @Min(1)
  customerId!: number;

  @IsOptional()
  @IsIn(['quotation', 'invoice', 'proforma_invoice'])
  invoiceType?: 'quotation' | 'invoice' | 'proforma_invoice';

  @IsOptional()
  @IsIn(['unpaid', 'paid', 'dummy'])
  status?: 'unpaid' | 'paid' | 'dummy';

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  billingStreet?: string;

  @IsOptional()
  @IsString()
  billingCity?: string;

  @IsOptional()
  @IsString()
  billingPostcode?: string;

  @IsOptional()
  @IsString()
  billingStateRegion?: string;

  @IsOptional()
  @IsString()
  billingCountry?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lines!: CreateInvoiceLineDto[];
}
