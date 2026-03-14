import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVendorInvoiceDto {
  @IsInt()
  @Min(1)
  supplierId!: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  purchaseOrderId?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  vendorInvoiceId?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  status?: string;
}
