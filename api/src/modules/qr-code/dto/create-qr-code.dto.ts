import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateQrCodeDto {
  @IsUUID()
  @IsNotEmpty()
  tableId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
