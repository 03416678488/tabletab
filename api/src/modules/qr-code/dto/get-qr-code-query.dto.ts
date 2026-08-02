import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetQrCodeFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  tableId?: string;

  @IsUUID()
  @IsOptional()
  areaId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsBooleanString()
  @IsOptional()
  isActive?: string;
}

export class GetQrCodeQueryDto extends IntersectionType(
  GetQrCodeFiltersDto,
  PaginationQueryDto,
) {}
