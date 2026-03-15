import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  itemGroup?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unitOfMeasure?: string;

  @IsOptional()
  @IsString()
  @IsIn(['produced', 'procured'])
  itemType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultBomId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultRoutingId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  safetyStock?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  preferredVendorId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
