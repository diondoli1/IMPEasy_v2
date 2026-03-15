export class CriticalOnHandResponseDto {
  itemId!: number;
  itemCode!: string | null;
  itemName!: string;
  onHandQuantity!: number;
  availableQuantity!: number;
  reorderPoint!: number;
  shortageState!: 'critical' | 'warning' | 'healthy';
}
