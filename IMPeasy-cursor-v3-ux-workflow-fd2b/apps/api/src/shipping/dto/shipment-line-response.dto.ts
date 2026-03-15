export class ShipmentLineResponseDto {
  id!: number;
  shipmentId!: number;
  salesOrderLineId!: number;
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  quantity!: number;
  pickedQuantity!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
