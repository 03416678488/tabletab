import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { PageContent } from '../entities/website-page.entity';

const SLUG_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class SaveDraftDto {
  @IsOptional()
  @IsString()
  title?: string;

  /** Opaque to the backend — validated/shaped by the client (zod). */
  @IsObject()
  content: PageContent;
}

export class CreatePageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsString()
  @Matches(SLUG_RULE, {
    message: 'Slug must be lowercase letters, numbers, and hyphens',
  })
  slug: string;
}

export class UpdateGeneralDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(SLUG_RULE, {
    message: 'Slug must be lowercase letters, numbers, and hyphens',
  })
  slug?: string;
}

export class UpdateSeoDto {
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsBoolean()
  noindex?: boolean;
}
