import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  menuItemId: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  guestName: string;

  @IsEmail()
  @IsOptional()
  guestEmail?: string;
}
