import { IsObject } from 'class-validator';

/** Save one group's key-value pairs at once. */
export class UpdateSettingsDto {
  @IsObject()
  values: Record<string, string>;
}
