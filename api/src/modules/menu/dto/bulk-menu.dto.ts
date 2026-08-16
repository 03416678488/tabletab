import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];
}

export class BulkAvailabilityDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  @IsBoolean()
  isAvailable: boolean;

  /** When set, overrides availability for this branch only; else the global flag. */
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

export class BulkCategoryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  @IsUUID()
  categoryId: string;
}
