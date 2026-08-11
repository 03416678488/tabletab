import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ItemTrackingType } from '@modules/menu/entities/menu-item.entity';

const TRACKING: ItemTrackingType[] = ['none', 'recipe', 'unit'];

export class RecipeLineInput {
  @IsUUID()
  stockItemId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

/**
 * Full replace of a menu item's inventory wiring: its tracking mode plus, for
 * recipe mode, the complete ingredient list (existing lines are replaced).
 */
export class SetRecipeDto {
  @IsIn(TRACKING)
  trackingType: ItemTrackingType;

  /** For `unit` tracking — the stock item this dish decrements directly. */
  @IsUUID()
  @IsOptional()
  stockItemId?: string;

  /** For `recipe` tracking — the ingredient lines (ignored otherwise). */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLineInput)
  @IsOptional()
  lines?: RecipeLineInput[];
}
