import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTaxGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  taxIds: number[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** Owning branch (from the topbar switcher). */
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class UpdateTaxGroupDto extends PartialType(CreateTaxGroupDto) {}
