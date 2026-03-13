import { IsOptional, IsString } from 'class-validator';

export class RecordInspectionScrapDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
