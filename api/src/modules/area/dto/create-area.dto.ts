import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Owning branch — areas are per-branch. */
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
