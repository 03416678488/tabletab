import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { RecipeLine } from './entities/recipe-line.entity';
import { SetRecipeDto } from './dto';

/** The inventory wiring of one menu item: its mode + (for recipes) its lines. */
export interface ItemRecipe {
  menuItemId: string;
  trackingType: MenuItem['trackingType'];
  stockItemId: string | null;
  lines: RecipeLine[];
}

/** Manages how menu items map onto stock — tracking mode + recipe lines. */
@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(RecipeLine)
    private readonly _lines: Repository<RecipeLine>,
    @InjectRepository(MenuItem)
    private readonly _menuItems: Repository<MenuItem>,
  ) {}

  async getRecipe(menuItemId: string): Promise<ItemRecipe> {
    const item = await this.ensureMenuItem(menuItemId);
    const lines = await this._lines.find({
      where: { menuItemId },
      relations: ['stockItem'],
      order: { createdAt: 'ASC' },
    });
    return {
      menuItemId,
      trackingType: item.trackingType,
      stockItemId: item.stockItemId,
      lines,
    };
  }

  /**
   * Replace a menu item's inventory wiring wholesale: set its tracking mode and,
   * for recipe mode, swap in the given ingredient lines. Switching away from
   * `recipe` clears the lines; away from `unit` clears the direct stock link.
   */
  async setRecipe(menuItemId: string, dto: SetRecipeDto): Promise<ItemRecipe> {
    await this.ensureMenuItem(menuItemId);

    await this._menuItems.update(menuItemId, {
      trackingType: dto.trackingType,
      stockItemId:
        dto.trackingType === 'unit' ? (dto.stockItemId ?? null) : null,
    });

    // Recipe lines only apply to recipe mode; otherwise clear them.
    await this._lines.delete({ menuItemId });
    if (dto.trackingType === 'recipe' && dto.lines?.length) {
      await this._lines.save(
        dto.lines.map((l) =>
          this._lines.create({
            menuItemId,
            stockItemId: l.stockItemId,
            quantity: l.quantity,
          }),
        ),
      );
    }
    return this.getRecipe(menuItemId);
  }

  private async ensureMenuItem(id: string): Promise<MenuItem> {
    const item = await this._menuItems.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found.');
    return item;
  }
}
