export class StockMovementResponseDto {
  id!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  stockLotId!: number | null;
  lotNumber!: string | null;
  movementType!: string;
  quantity!: number;
  reference!: string | null;
  transactionDate!: Date;
  notes!: string | null;
}
