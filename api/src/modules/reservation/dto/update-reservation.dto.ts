import { IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

const STATUSES = ['requested', 'confirmed', 'seated', 'completed', 'no-show', 'cancelled'];

export class UpdateReservationDto {
  @IsIn(STATUSES)
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  partySize?: number;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}
