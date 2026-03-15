import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { CustomerAddressDto } from '../../crm/dto/customer-address.dto';
import { QuoteLineInputDto } from './quote-line-input.dto';

export class UpdateQuoteDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  customerId?: number;

  @IsOptional()
  @IsDateString()
  quoteDate?: string;

  @IsOptional()
  @IsDateString()
  validityDate?: string;

  @IsOptional()
  @IsDateString()
  promisedDate?: string;

  @IsOptional()
  @IsString()
  customerReference?: string;

  @IsOptional()
  @IsString()
  salespersonName?: string;

  @IsOptional()
  @IsEmail()
  salespersonEmail?: string;

  @IsOptional()
  @IsString()
  paymentTerm?: string;

  @IsOptional()
  @IsString()
  shippingTerm?: string;

  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @IsOptional()
  @IsIn(['exclusive', 'inclusive'])
  taxMode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  documentDiscountPercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  billingAddress?: CustomerAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  shippingAddress?: CustomerAddressDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineInputDto)
  lines?: QuoteLineInputDto[];
}
