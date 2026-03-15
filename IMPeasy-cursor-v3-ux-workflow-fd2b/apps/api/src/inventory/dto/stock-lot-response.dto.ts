export class StockLotResponseDto {
  id!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  lotNumber!: string;
  sourceDocument!: string | null;
  quantityOnHand!: number;
  reservedQuantity!: number;
  availableQuantity!: number;
  status!: string;
  receivedOrProducedAt!: Date | null;
  notes!: string | null;
}
