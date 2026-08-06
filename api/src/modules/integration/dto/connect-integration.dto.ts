import { IsObject, IsOptional } from 'class-validator';

export class ConnectIntegrationDto {
  /** Provider credentials/config keyed by the catalog field keys. */
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
