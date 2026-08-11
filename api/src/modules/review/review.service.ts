import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { NotificationService } from '@modules/notification/notification.service';

import { Review } from './entities/review.entity';
import { ReviewValidatorService } from './services/review-validator.service';
import { ReviewHelperService } from './services/review.helper.service';
import { CreateReviewDto, UpdateReviewDto, GetReviewQueryDto } from './dto';

/** Aggregate rating for an item, over approved reviews only. */
export interface ReviewSummary {
  menuItemId: string;
  average: number;
  count: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Main review flow only — validation + normalization live in sibling services. */
@Injectable()
export class ReviewService extends AbstractService<Review> {
  constructor(
    @InjectRepository(Review)
    protected readonly repository: Repository<Review>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: ReviewValidatorService,
    private readonly _helper: ReviewHelperService,
    private readonly _notifications: NotificationService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  // ── Staff: moderation queue ───────────────────────────────────────────────
  getAll(query: GetReviewQueryDto): Promise<Paginated<Review>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(
      query,
      this.repository,
      where,
      ['menuItem', 'branch'],
      undefined,
      { createdAt: 'DESC' },
    );
  }

  getById(id: string): Promise<Review> {
    return this._validator.ensureExists(id);
  }

  // ── Public: approved reviews for the storefront ───────────────────────────
  listPublished(menuItemId: string): Promise<Review[]> {
    return this.repository.find({
      where: { menuItemId, status: 'approved' },
      order: { createdAt: 'DESC' },
    });
  }

  async summary(menuItemId: string): Promise<ReviewSummary> {
    const { avg, count } = await this.repository
      .createQueryBuilder('r')
      .select('COALESCE(AVG(r.rating), 0)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r."menuItemId" = :menuItemId', { menuItemId })
      .andWhere("r.status = 'approved'")
      .getRawOne<{ avg: string; count: string }>();
    return {
      menuItemId,
      average: round1(Number(avg) || 0),
      count: Number(count) || 0,
    };
  }

  // ── Public: submit a review (starts pending) ──────────────────────────────
  async createReview(dto: CreateReviewDto): Promise<Review> {
    await this._validator.validateCreate(dto);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    const review = await this.getById(saved.id);
    await this.notifyNew(review);
    return review;
  }

  // ── Staff: approve / reject ───────────────────────────────────────────────
  async moderate(id: string, dto: UpdateReviewDto): Promise<Review> {
    await this._validator.ensureExists(id);
    const patch = this._helper.resolveUpdatePayload(dto);
    if (patch.status && patch.status !== 'pending') {
      patch.moderatedBy =
        (this._req as unknown as { user?: { id?: string } }).user?.id ?? null;
    }
    await this.repository.update(id, patch);
    return this.getById(id);
  }

  deleteReview(id: string) {
    return this.delete(id);
  }

  /** Alert managers to a new review awaiting moderation (best-effort). */
  private async notifyNew(r: Review): Promise<void> {
    try {
      await this._notifications.notifyRoles(
        ['Owner', 'Multi Branch Manager', 'Branch Manager'],
        {
          category: 'reviews',
          type: 'review.created',
          title: `New review — ${r.rating}★`,
          body: `${r.guestName} on ${r.menuItem?.name ?? 'an item'}`,
          data: { reviewId: r.id, menuItemId: r.menuItemId },
          priority: 'normal',
          branchId: r.branchId ?? null,
        },
      );
    } catch (err) {
      console.warn(
        '[notify] review notification failed',
        (err as Error).message,
      );
    }
  }
}
