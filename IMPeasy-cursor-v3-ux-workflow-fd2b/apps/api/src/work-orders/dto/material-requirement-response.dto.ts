import { MaterialBookingResponseDto } from './material-booking-response.dto';

export class MaterialRequirementAvailableLotResponseDto {
  id!: number;
  lotNumber!: string;
  availableQuantity!: number;
}

export class MaterialRequirementResponseDto {
  bomItemId!: number;
  rowOrder!: number;
  componentItemId!: number;
  componentItemCode!: string;
  componentItemName!: string;
  unitOfMeasure!: string;
  requiredQuantity!: number;
  bookedQuantity!: number;
  availableQuantity!: number;
  notes!: string | null;
  bookings!: MaterialBookingResponseDto[];
  availableLots!: MaterialRequirementAvailableLotResponseDto[];
}
