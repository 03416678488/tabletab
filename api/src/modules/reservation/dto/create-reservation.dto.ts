import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsInt()
  @Min(1)
  partySize: number;

  /** YYYY-MM-DD */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  /** HH:mm (24h) */
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:mm' })
  time: string;

  @IsInt()
  @Min(15)
  @IsOptional()
  durationMins?: number;

  @IsString()
  @IsNotEmpty()
  guestName: string;

  @IsString()
  @IsNotEmpty()
  guestPhone: string;

  @IsString()
  @IsOptional()
  guestEmail?: string;

  @IsString()
  @IsOptional()
  specialRequests?: string;

  @IsIn(['online', 'phone', 'walk-in'])
  @IsOptional()
  source?: 'online' | 'phone' | 'walk-in';
}
