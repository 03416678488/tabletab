import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TranslationItemDto {
  @IsString()
  @IsNotEmpty()
  field: string;

  @IsString()
  @IsNotEmpty()
  locale: string;

  @IsString()
  @IsOptional()
  value?: string;
}

/** Replace all translations for one (entity, entityId). */
export class SaveTranslationsDto {
  @IsString()
  @IsNotEmpty()
  entity: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  items: TranslationItemDto[];
}
