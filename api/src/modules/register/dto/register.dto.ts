import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class OpenRegisterDto {
  @IsNumber()
  @Min(0)
  openingBalance: number;

  /** The branch whose drawer is being opened. */
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CloseRegisterDto {
  @IsNumber()
  @Min(0)
  countedBalance: number;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CashMovementDto {
  @IsIn(['cash_in', 'cash_out'])
  type: 'cash_in' | 'cash_out';

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
