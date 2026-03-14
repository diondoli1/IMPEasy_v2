export type ProductGroup = {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductGroupInput = {
  name: string;
};

export type UnitOfMeasure = {
  id: number;
  name: string;
  baseUnit: string | null;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
};

export type UnitOfMeasureInput = {
  name: string;
  baseUnit?: string;
  conversionRate?: number;
};
