import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsInt()
  @Min(1)
  itemId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantityOnHand?: number;
}
