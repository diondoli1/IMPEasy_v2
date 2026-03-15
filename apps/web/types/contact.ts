export type Contact = {
  id: number;
  customerId: number;
  name: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContactInput = {
  name: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
  isActive?: boolean;
};
