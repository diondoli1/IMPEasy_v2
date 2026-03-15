import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class ReplaceUserRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  roleIds!: number[];
}
