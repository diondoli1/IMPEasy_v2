export class StockLotReservationResponseDto {
  kind!: string;
  reference!: string;
  quantity!: number;
}

export class StockLotDetailResponseDto {
  id!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  lotNumber!: string;
  sourceDocument!: string | null;
  receivedOrProducedAt!: Date | null;
  quantityOnHand!: number;
  reservedQuantity!: number;
  availableQuantity!: number;
  status!: string;
  notes!: string | null;
  reservations!: StockLotReservationResponseDto[];
}
