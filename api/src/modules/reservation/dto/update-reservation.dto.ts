import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

const STATUSES = [
  'requested',
  'confirmed',
  'seated',
  'completed',
  'no-show',
  'cancelled',
];
const METHODS = ['cash', 'card', 'mfs', 'other'];

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

  /** Booking deposit collected now (e.g. on confirm). Posts a transaction. */
  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @IsIn(METHODS)
  @IsOptional()
  depositMethod?: string;
}
