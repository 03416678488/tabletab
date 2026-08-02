import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class MenuOptionRowDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  foodTypeIds?: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  menuIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuOptionRowDto)
  @IsOptional()
  sizes?: MenuOptionRowDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuOptionRowDto)
  @IsOptional()
  variants?: MenuOptionRowDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuOptionRowDto)
  @IsOptional()
  addOns?: MenuOptionRowDto[];
}
