import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateShipmentDto {
  @IsOptional()
  @IsDateString()
  shipDate?: string;

  @IsOptional()
  @IsString()
  carrierMethod?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
