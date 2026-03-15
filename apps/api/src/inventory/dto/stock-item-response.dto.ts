export class StockItemResponseDto {
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  itemGroup!: string | null;
  productGroupCode!: string | null;
  unitOfMeasure!: string;
  onHandQuantity!: number;
  availableQuantity!: number;
  bookedQuantity!: number;
  expectedQuantity!: number;
  wipQuantity!: number;
  reorderPoint!: number;
  defaultPrice!: number;
}
