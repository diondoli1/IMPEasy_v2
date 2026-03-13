export class StockItemResponseDto {
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  unitOfMeasure!: string;
  onHandQuantity!: number;
  availableQuantity!: number;
  bookedQuantity!: number;
  expectedQuantity!: number;
  wipQuantity!: number;
  reorderPoint!: number;
}
