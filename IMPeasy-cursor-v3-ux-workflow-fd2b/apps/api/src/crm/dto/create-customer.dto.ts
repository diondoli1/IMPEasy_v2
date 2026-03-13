import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { CustomerAddressDto } from './customer-address.dto';
import { CustomerContactInputDto } from './customer-contact-input.dto';

const PHONE_REGEX = /^[+]?[- ()0-9]{7,20}$/;

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(PHONE_REGEX, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  billingAddress?: CustomerAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  shippingAddress?: CustomerAddressDto;

  @IsOptional()
  @IsString()
  defaultPaymentTerm?: string;

  @IsOptional()
  @IsString()
  defaultShippingTerm?: string;

  @IsOptional()
  @IsString()
  defaultShippingMethod?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultDocumentDiscountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultTaxRate?: number;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerContactInputDto)
  contacts?: CustomerContactInputDto[];
}
