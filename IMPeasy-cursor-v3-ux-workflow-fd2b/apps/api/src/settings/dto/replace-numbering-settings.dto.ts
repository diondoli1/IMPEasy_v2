import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { UpdateNumberingSettingDto } from './update-numbering-setting.dto';

export class ReplaceNumberingSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateNumberingSettingDto)
  settings!: UpdateNumberingSettingDto[];
}
