import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

import {
  TrimOptionalNullableString,
  TrimRequiredString,
  ValidateWhenPresent,
} from './supplier-dto.utils';

const PHONE_REGEX = /^[+]?[- ()0-9]{7,20}$/;

export class UpdateSupplierDto {
  @TrimOptionalNullableString()
  @ValidateWhenPresent()
  @IsString()
  @MinLength(1)
  code?: string | null;

  @TrimRequiredString()
  @ValidateWhenPresent()
  @IsString()
  @MinLength(1)
  name?: string;

  @TrimOptionalNullableString()
  @ValidateWhenPresent()
  @IsEmail()
  email?: string | null;

  @TrimOptionalNullableString()
  @ValidateWhenPresent()
  @Matches(PHONE_REGEX, {
    message: 'phone must be a valid phone number',
  })
  phone?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
