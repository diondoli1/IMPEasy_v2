export type WorkstationGroup = {
  id: number;
  code: string | null;
  name: string;
  type: string | null;
  instanceCount: number;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkstationGroupInput = {
  code?: string;
  name: string;
  type?: string;
  instanceCount?: number;
  hourlyRate?: number;
};

export type Workstation = {
  id: number;
  workstationGroupId: number;
  code: string | null;
  name: string;
  type: string | null;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkstationInput = {
  workstationGroupId: number;
  code?: string;
  name: string;
  type?: string;
  hourlyRate?: number;
};
