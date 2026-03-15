import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class UpsertShipmentPickLineDto {
  @IsInt()
  @Min(1)
  shipmentLineId!: number;

  @IsInt()
  @Min(1)
  stockLotId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpsertShipmentPicksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertShipmentPickLineDto)
  picks!: UpsertShipmentPickLineDto[];
}
