import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** Owning branch (from the topbar switcher). */
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class UpdateTaxDto extends PartialType(CreateTaxDto) {}
