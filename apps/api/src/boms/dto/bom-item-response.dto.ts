export class BomItemResponseDto {
  id!: number;
  bomId!: number;
  rowOrder!: number;
  itemId!: number;
  itemCode!: string;
  itemName!: string;
  itemGroup!: string | null;
  unitOfMeasure!: string;
  quantity!: number;
  notes!: string | null;
  approximateCost!: number | null;
  defaultPrice!: number;
  lineCost!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
