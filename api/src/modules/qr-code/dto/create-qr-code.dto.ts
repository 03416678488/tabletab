import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

const CUSTOM_TYPES = ['url', 'review', 'wifi', 'text', 'phone', 'email'];

export class CreateQrCodeDto {
  /** Defaults to 'table' for backwards compatibility. */
  @IsIn(['table', 'custom'])
  @IsOptional()
  kind?: 'table' | 'custom';

  /** Required for table codes; ignored for custom codes. */
  @ValidateIf((o: CreateQrCodeDto) => (o.kind ?? 'table') === 'table')
  @IsUUID()
  @IsNotEmpty()
  tableId?: string;

  /** Required for custom codes — the display name. */
  @ValidateIf((o: CreateQrCodeDto) => o.kind === 'custom')
  @IsString()
  @IsNotEmpty()
  label?: string;

  /** Required for custom codes — the exact string the code encodes. */
  @ValidateIf((o: CreateQrCodeDto) => o.kind === 'custom')
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsIn(CUSTOM_TYPES)
  @IsOptional()
  customType?: string;

  /** Owning branch for a custom code (from the topbar switcher). */
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
