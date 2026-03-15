import { IsDateString, IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

import { TrimOptionalString } from './supplier-dto.utils';

export class ReceivePurchaseOrderLineDto {
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  existingLotId?: number;

  @TrimOptionalString()
  @ValidateIf((object: ReceivePurchaseOrderLineDto) => !object.existingLotId)
  @IsString()
  lotNumber?: string;

  @TrimOptionalString()
  @IsOptional()
  @IsDateString()
  receiptDate?: string;

  @TrimOptionalString()
  @IsOptional()
  @IsString()
  notes?: string;
}
