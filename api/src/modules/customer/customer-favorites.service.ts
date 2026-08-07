import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CustomerFavorite } from './entities/customer-favorite.entity';

/** CRUD for a storefront customer's saved menu items (tenant-scoped repo). */
@Injectable()
export class CustomerFavoritesService {
  constructor(
    @InjectRepository(CustomerFavorite)
    private readonly repo: Repository<CustomerFavorite>,
  ) {}

  /** The customer's saved menu item ids, oldest saved first. */
  async listItemIds(customerId: string): Promise<string[]> {
    const rows = await this.repo.find({
      where: { customerId },
      order: { createdAt: 'ASC' },
      select: ['menuItemId'],
    });
    return rows.map((r) => r.menuItemId);
  }

  /** Add a favorite (idempotent — a repeat is a no-op). */
  async add(customerId: string, menuItemId: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { customerId, menuItemId } });
    if (!existing) {
      await this.repo.save(this.repo.create({ customerId, menuItemId }));
    }
  }

  async remove(customerId: string, menuItemId: string): Promise<void> {
    await this.repo.delete({ customerId, menuItemId });
  }
}
