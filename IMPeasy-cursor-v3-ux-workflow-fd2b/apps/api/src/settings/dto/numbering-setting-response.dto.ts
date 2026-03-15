import type { NumberingDocumentType } from '../constants/settings.constants';

export class NumberingSettingResponseDto {
  id!: number;
  documentType!: NumberingDocumentType;
  prefix!: string;
  separator!: string;
  padding!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
