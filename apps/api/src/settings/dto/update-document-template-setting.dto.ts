import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDocumentTemplateSettingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  outputFormat?: string;

  @IsOptional()
  @IsBoolean()
  headerFieldsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  footerNotesEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
