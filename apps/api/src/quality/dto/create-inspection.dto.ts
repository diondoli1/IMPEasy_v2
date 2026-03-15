import { IsOptional, IsString } from 'class-validator';

export class CreateInspectionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
