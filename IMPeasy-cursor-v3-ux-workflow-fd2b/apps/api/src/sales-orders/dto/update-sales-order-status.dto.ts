import { IsIn, IsString } from 'class-validator';

export class UpdateSalesOrderStatusDto {
  @IsString()
  @IsIn(['confirmed', 'released', 'in_production', 'shipped', 'invoiced', 'closed'])
  status!: string;
}
