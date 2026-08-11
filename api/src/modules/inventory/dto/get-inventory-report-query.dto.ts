import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** Filters for the inventory report — a branch and an optional date window. */
export class GetInventoryReportQueryDto {
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
