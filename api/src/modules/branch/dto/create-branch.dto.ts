import {
  IsBoolean,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;

  @IsLatitude()
  @IsOptional()
  lat?: number;

  @IsLongitude()
  @IsOptional()
  lng?: number;

  // Structured weekly hours ({ mon: { closed, open, close }, … }); null/omitted
  // = inherit the global opening times. Shape is validated on the client.
  @IsObject()
  @IsOptional()
  openingHours?: Record<string, unknown> | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrder?: number;

  @IsBoolean()
  @IsOptional()
  onlineOrderingEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  deliveryEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  pickupEnabled?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryEtaMinutes?: number;

  // ── Reservation settings ──
  @IsBoolean()
  @IsOptional()
  reservationsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  eventsEnabled?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservationTurnMins?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservationReminderLeadMins?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservationNoShowGraceMins?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservationBookingWindowDays?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservationCutoffMins?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservationDepositPerGuest?: number;

  /** Dine-in (QR) payment timing: 'pay_after' (default) or 'pay_first' (prepay). */
  @IsIn(['pay_first', 'pay_after'])
  @IsOptional()
  dineInPaymentMode?: 'pay_first' | 'pay_after';
}
