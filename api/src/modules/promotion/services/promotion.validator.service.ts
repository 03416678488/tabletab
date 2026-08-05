import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { Promotion } from '../entities/promotion.entity';

/** Existence + uniqueness guards for promotions. */
@Injectable()
export class PromotionValidatorService {
  constructor(
    @InjectRepository(Promotion)
    private readonly repository: Repository<Promotion>,
  ) {}

  async ensureExists(id: string): Promise<Promotion> {
    const promotion = await this.repository.findOne({ where: { id } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async ensureUniqueSlug(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.repository.findOne({
      where: excludeId ? { slug, id: Not(excludeId) } : { slug },
    });
    if (existing) throw new ConflictException('A promotion with this slug already exists');
  }

  async ensureUniqueCode(code: string | null | undefined, excludeId?: string): Promise<void> {
    if (!code) return;
    const existing = await this.repository.findOne({
      where: excludeId ? { code, id: Not(excludeId) } : { code },
    });
    if (existing) throw new ConflictException('A promotion with this code already exists');
  }
}
