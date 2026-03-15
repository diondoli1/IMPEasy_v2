import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RecordInspectionResultDto {
  @IsIn(['passed', 'failed'])
  status!: 'passed' | 'failed';

  @IsInt()
  @Min(0)
  passedQuantity!: number;

  @IsInt()
  @Min(0)
  failedQuantity!: number;

  @IsInt()
  @Min(0)
  reworkQuantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
