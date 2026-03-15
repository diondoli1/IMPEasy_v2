export class ContactResponseDto {
  id!: number;
  customerId!: number;
  name!: string;
  jobTitle!: string | null;
  email!: string | null;
  phone!: string | null;
  isPrimary!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
