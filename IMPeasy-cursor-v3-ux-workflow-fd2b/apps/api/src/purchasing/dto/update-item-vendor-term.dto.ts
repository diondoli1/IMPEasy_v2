import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

import { TrimOptionalNullableString, TrimOptionalString } from './supplier-dto.utils';

export class UpdateItemVendorTermDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  itemId?: number;

  @TrimOptionalNullableString()
  @IsOptional()
  @IsString()
  @MinLength(1)
  vendorItemCode?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3650)
  leadTimeDays?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @TrimOptionalNullableString()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
