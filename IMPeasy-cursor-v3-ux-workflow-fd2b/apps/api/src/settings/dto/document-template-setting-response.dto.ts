import type { DocumentTemplateType } from '../constants/settings.constants';

export class DocumentTemplateSettingResponseDto {
  id!: number;
  templateType!: DocumentTemplateType;
  outputFormat!: string;
  headerFieldsEnabled!: boolean;
  footerNotesEnabled!: boolean;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
