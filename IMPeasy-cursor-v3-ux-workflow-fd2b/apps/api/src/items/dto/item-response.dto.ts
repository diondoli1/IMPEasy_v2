export class ItemResponseDto {
  id!: number;
  code!: string;
  name!: string;
  description!: string | null;
  isActive!: boolean;
  itemGroup!: string | null;
  unitOfMeasure!: string;
  itemType!: string;
  defaultBomId!: number | null;
  defaultBomName!: string | null;
  defaultRoutingId!: number | null;
  defaultRoutingName!: string | null;
  defaultPrice!: number;
  reorderPoint!: number;
  safetyStock!: number;
  preferredVendorId!: number | null;
  preferredVendorName!: string | null;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
