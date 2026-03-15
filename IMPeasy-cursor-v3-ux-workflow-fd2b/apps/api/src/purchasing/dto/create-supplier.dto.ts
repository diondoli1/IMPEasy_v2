import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

import { TrimOptionalString, TrimRequiredString } from './supplier-dto.utils';

const PHONE_REGEX = /^[+]?[- ()0-9]{7,20}$/;

export class CreateSupplierDto {
  @TrimOptionalString()
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @TrimRequiredString()
  @IsString()
  @MinLength(1)
  name!: string;

  @TrimOptionalString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @TrimOptionalString()
  @IsOptional()
  @Matches(PHONE_REGEX, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @TrimOptionalString()
  @IsOptional()
  @IsString()
  @MinLength(1)
  paymentTerm?: string;
}
