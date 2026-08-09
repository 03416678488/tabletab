import {
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

const STATUSES = ['requested', 'confirmed', 'completed', 'cancelled'];

export class UpdateEventDto {
  @IsIn(STATUSES)
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  eventTypeId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  @IsOptional()
  date?: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be HH:mm' })
  @IsOptional()
  startTime?: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be HH:mm' })
  @IsOptional()
  endTime?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  guestCount?: number;

  @IsNumberString()
  @IsOptional()
  budget?: string;

  @IsString()
  @IsOptional()
  specialRequests?: string;

  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
