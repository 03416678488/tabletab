import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseOrderLineInput {
  @IsUUID()
  stockItemId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  @IsOptional()
  supplierId?: string;

  /** `draft` to keep editing, `ordered` to mark it sent. */
  @IsIn(['draft', 'ordered'])
  @IsOptional()
  status?: 'draft' | 'ordered';

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineInput)
  lines: PurchaseOrderLineInput[];
}
