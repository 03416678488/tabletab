import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class MenuItemTranslationEntryDto {
  /** Language code, e.g. 'ar'. */
  @IsString()
  @IsNotEmpty()
  locale: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class SaveMenuItemTranslationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemTranslationEntryDto)
  entries: MenuItemTranslationEntryDto[];
}
