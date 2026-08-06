import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class SetUserBranchDto {
  /** Branch to scope the user to. `null` clears the assignment (sees all). */
  @IsOptional()
  @ValidateIf((o) => o.branchId !== null)
  @IsUUID()
  branchId?: string | null;
}
