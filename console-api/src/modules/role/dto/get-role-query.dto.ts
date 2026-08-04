import { IsDate, IsOptional } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

class GetRoleBasedDto {
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;
}

export class GetRoleQueryDto extends IntersectionType(GetRoleBasedDto, PaginationQueryDto) {}
