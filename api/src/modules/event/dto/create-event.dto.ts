import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  @IsOptional()
  eventTypeId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  /** YYYY-MM-DD */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  /** HH:mm (24h) */
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be HH:mm' })
  startTime: string;

  /** HH:mm (24h) */
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be HH:mm' })
  @IsOptional()
  endTime?: string;

  @IsInt()
  @Min(1)
  guestCount: number;

  @IsString()
  @IsNotEmpty()
  guestName: string;

  @IsString()
  @IsNotEmpty()
  guestPhone: string;

  @IsString()
  @IsOptional()
  guestEmail?: string;

  @IsNumberString()
  @IsOptional()
  budget?: string;

  @IsString()
  @IsOptional()
  specialRequests?: string;

  @IsIn(['online', 'phone', 'walk-in'])
  @IsOptional()
  source?: 'online' | 'phone' | 'walk-in';
}
