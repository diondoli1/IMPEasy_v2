export class ShipmentPickResponseDto {
  id!: number;
  shipmentLineId!: number;
  stockLotId!: number;
  lotNumber!: string;
  quantity!: number;
  pickedAt!: Date | null;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
