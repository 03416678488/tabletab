import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';

import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dto';

@Injectable()
export class ReviewValidatorService extends AbstractService<Review> {
  constructor(
    @InjectRepository(Review)
    protected readonly repository: Repository<Review>,
    @InjectRepository(MenuItem)
    private readonly _itemRepository: Repository<MenuItem>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  /** The item must exist before a guest may review it. */
  async validateCreate(dto: CreateReviewDto): Promise<void> {
    const item = await this._itemRepository.findOne({
      where: { id: dto.menuItemId },
    });
    if (!item) {
      this._errors.add('menuItemId', 'Menu item not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }

  /** Fetch a review (+ item, branch) or raise a 404. */
  async ensureExists(id: string): Promise<Review> {
    const review = await this.repository.findOne({
      where: { id },
      relations: ['menuItem', 'branch'],
    });
    if (!review) {
      this._errors.add('review', 'Review not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return review;
  }
}
