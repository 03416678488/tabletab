import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ClockInDto {
  /** Branch to go on duty at; defaults to the user's home branch. */
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
