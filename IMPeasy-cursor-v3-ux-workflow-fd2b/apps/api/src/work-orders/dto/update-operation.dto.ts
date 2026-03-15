import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateOperationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  assignedOperatorId?: number;
}
