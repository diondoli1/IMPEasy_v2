import { IsIn, IsString } from 'class-validator';

export class UpdateQuoteStatusDto {
  @IsString()
  @IsIn(['sent', 'approved', 'rejected'])
  status!: string;
}
