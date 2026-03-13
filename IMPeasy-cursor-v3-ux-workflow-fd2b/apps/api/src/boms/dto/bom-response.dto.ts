export class BomResponseDto {
  id!: number;
  itemId!: number;
  itemCode!: string;
  itemName!: string;
  code!: string;
  name!: string;
  description!: string | null;
  status!: string;
  notes!: string | null;
  roughCost!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
