export type Item = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  itemGroup: string | null;
  unitOfMeasure: string;
  itemType: 'produced' | 'procured';
  defaultBomId: number | null;
  defaultBomName: string | null;
  defaultRoutingId: number | null;
  defaultRoutingName: string | null;
  defaultPrice: number;
  reorderPoint: number;
  safetyStock: number;
  preferredVendorId: number | null;
  preferredVendorName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemInput = {
  code?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  itemGroup?: string;
  unitOfMeasure?: string;
  itemType?: 'produced' | 'procured';
  defaultBomId?: number;
  defaultRoutingId?: number;
  defaultPrice?: number;
  reorderPoint?: number;
  safetyStock?: number;
  preferredVendorId?: number;
  notes?: string;
};
