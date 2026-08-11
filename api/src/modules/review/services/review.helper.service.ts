import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { trimSpaces } from '@cor/helpers';
import { toILikeContains } from '@cor/helpers/query.helper';

import { Review, ReviewStatus } from '../entities/review.entity';
import { CreateReviewDto, GetReviewQueryDto, UpdateReviewDto } from '../dto';

/** Pure resolver helpers — payload shaping + query building. */
@Injectable()
export class ReviewHelperService {
  resolveCreatePayload(dto: CreateReviewDto): Partial<Review> {
    return {
      menuItemId: dto.menuItemId,
      branchId: dto.branchId ?? null,
      rating: dto.rating,
      comment: dto.comment ? trimSpaces(dto.comment) : null,
      guestName: trimSpaces(dto.guestName),
      guestEmail: dto.guestEmail?.trim() || null,
      // Every guest review starts pending — nothing is public until moderated.
      status: 'pending',
      source: 'online',
    };
  }

  resolveUpdatePayload(dto: UpdateReviewDto): Partial<Review> {
    const patch: Partial<Review> = {};
    if (dto.status !== undefined) {
      patch.status = dto.status as ReviewStatus;
      // Stamp the moderation time on any approve/reject decision.
      patch.moderatedAt = dto.status === 'pending' ? null : new Date();
    }
    return patch;
  }

  resolveListFilters(query: GetReviewQueryDto): FindOptionsWhere<Review> {
    const where: FindOptionsWhere<Review> = {};
    if (query.menuItemId) where.menuItemId = query.menuItemId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status as ReviewStatus;
    if (query.search)
      where.guestName = toILikeContains(trimSpaces(query.search));
    return where;
  }
}
