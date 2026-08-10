import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

/** A selection of entity ids for a bulk operation. */
export class BulkIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];
}

/** Bulk activate / deactivate. */
export class BulkActiveDto extends BulkIdsDto {
  @IsBoolean()
  isActive: boolean;
}
