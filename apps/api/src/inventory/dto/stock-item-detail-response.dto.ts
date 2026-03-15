import { StockLotResponseDto } from './stock-lot-response.dto';
import { StockMovementResponseDto } from './stock-movement-response.dto';

export class LinkedStockDocumentResponseDto {
  kind!: string;
  reference!: string;
}

export class StockItemDetailResponseDto {
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  unitOfMeasure!: string;
  reorderPoint!: number;
  onHandQuantity!: number;
  availableQuantity!: number;
  bookedQuantity!: number;
  expectedQuantity!: number;
  wipQuantity!: number;
  lots!: StockLotResponseDto[];
  movements!: StockMovementResponseDto[];
  linkedDocuments!: LinkedStockDocumentResponseDto[];
}
