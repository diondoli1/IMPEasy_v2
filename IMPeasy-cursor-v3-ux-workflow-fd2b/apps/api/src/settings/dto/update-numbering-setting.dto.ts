import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

import { NUMBERING_DOCUMENT_TYPES } from '../constants/settings.constants';

export class UpdateNumberingSettingDto {
  @IsIn(NUMBERING_DOCUMENT_TYPES)
  documentType!: (typeof NUMBERING_DOCUMENT_TYPES)[number];

  @IsString()
  @MinLength(1)
  prefix!: string;

  @IsOptional()
  @IsString()
  separator?: string;

  @IsInt()
  @Min(1)
  @Max(8)
  padding!: number;
}
