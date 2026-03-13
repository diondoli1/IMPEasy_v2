export class BomItemResponseDto {
  id!: number;
  bomId!: number;
  rowOrder!: number;
  itemId!: number;
  itemCode!: string;
  itemName!: string;
  unitOfMeasure!: string;
  quantity!: number;
  notes!: string | null;
  defaultPrice!: number;
  lineCost!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
