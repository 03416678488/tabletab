import { IsDate, IsOptional } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetPermissionBasedDto {
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;
}

export class GetPermissionQueryDto extends IntersectionType(
  GetPermissionBasedDto,
  PaginationQueryDto,
) {}
