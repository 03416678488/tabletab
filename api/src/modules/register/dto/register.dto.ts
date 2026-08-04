import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenRegisterDto {
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CloseRegisterDto {
  @IsNumber()
  @Min(0)
  countedBalance: number;

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

  @IsString()
  @IsOptional()
  note?: string;
}
