export type Routing = {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type RoutingInput = {
  itemId: number;
  code?: string;
  name: string;
  description?: string;
  status?: string;
};

export type RoutingOperation = {
  id: number;
  routingId: number;
  sequence: number;
  name: string;
  description: string | null;
  workstation: string | null;
  workstationGroupId: number | null;
  workstationGroupName: string | null;
  setupTimeMinutes: number;
  runTimeMinutes: number;
  cost: number | null;
  queueNotes: string | null;
  moveNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoutingOperationInput = {
  sequence: number;
  name: string;
  description?: string;
  workstation?: string;
  workstationGroupId?: number;
  setupTimeMinutes?: number;
  runTimeMinutes?: number;
  cost?: number;
  queueNotes?: string;
  moveNotes?: string;
};

export type RoutingLinkResponse = {
  itemId: number;
  routingId: number;
};

export type RoutingUpdateInput = Partial<Omit<RoutingInput, 'itemId'>>;
export type RoutingOperationUpdateInput = Partial<RoutingOperationInput>;
