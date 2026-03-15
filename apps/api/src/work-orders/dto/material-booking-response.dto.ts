export class MaterialBookingResponseDto {
  id!: number;
  bomItemId!: number;
  stockLotId!: number;
  lotNumber!: string;
  quantity!: number;
  consumedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
