import type { SettingsListType } from '../constants/settings.constants';

export class SettingsListEntryResponseDto {
  id!: number;
  listType!: SettingsListType;
  code!: string;
  label!: string;
  numericValue!: number | null;
  isActive!: boolean;
  sortOrder!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
