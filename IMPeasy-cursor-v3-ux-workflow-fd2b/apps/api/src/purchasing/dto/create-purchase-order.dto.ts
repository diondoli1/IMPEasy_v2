import { IsDateString, IsInt, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

import { TrimOptionalString } from './supplier-dto.utils';

const ISO_CURRENCY_REGEX = /^[A-Z]{3}$/;

export class CreatePurchaseOrderDto {
  @IsInt()
  @Min(1)
  supplierId!: number;

  @TrimOptionalString()
  @IsOptional()
  @IsString()
  @MinLength(1)
  supplierReference?: string;

  @TrimOptionalString()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @TrimOptionalString()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @TrimOptionalString()
  @IsOptional()
  @IsString()
  @MinLength(1)
  buyer?: string;

  @TrimOptionalString()
  @IsOptional()
  @Matches(ISO_CURRENCY_REGEX)
  currency?: string;

  @TrimOptionalString()
  @IsOptional()
  @IsString()
  @MinLength(1)
  paymentTerm?: string;

  @TrimOptionalString()
  @IsOptional()
  @IsString()
  notes?: string;
}
