export type Bom = {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  notes: string | null;
  roughCost: number;
  createdAt: string;
  updatedAt: string;
};

export type BomInput = {
  itemId: number;
  code?: string;
  name: string;
  description?: string;
  status?: string;
  notes?: string;
};

export type BomItem = {
  id: number;
  bomId: number;
  rowOrder: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  itemGroup: string | null;
  unitOfMeasure: string;
  quantity: number;
  notes: string | null;
  approximateCost: number | null;
  defaultPrice: number;
  lineCost: number;
  createdAt: string;
  updatedAt: string;
};

export type BomItemInput = {
  itemId: number;
  quantity: number;
  rowOrder?: number;
  notes?: string;
  approximateCost?: number;
};

export type BomUpdateInput = Partial<Omit<BomInput, 'itemId'>>;
export type BomItemUpdateInput = Partial<BomItemInput>;
export type BomLinkResponse = {
  itemId: number;
  bomId: number;
};
