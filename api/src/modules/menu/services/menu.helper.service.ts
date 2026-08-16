import { Injectable } from '@nestjs/common';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
} from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { MenuItem, MenuOptionRow } from '../entities/menu-item.entity';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  GetMenuItemQueryDto,
} from '../dto';
import { toILikeContains } from '@cor/helpers/query.helper';

/**
 * Pure resolver helpers for the menu module — normalization, defaults and
 * query building. Relation ids (foodTypeIds/menuIds) are handled in the
 * service; this only produces the scalar + JSON column payload.
 */
@Injectable()
export class MenuHelperService {
  resolveCreatePayload(dto: CreateMenuItemDto): Partial<MenuItem> {
    const images = this.cleanImages(dto.images);
    return {
      name: trimSpaces(dto.name),
      description: dto.description ? trimSpaces(dto.description) : undefined,
      price: dto.price,
      images,
      // imageUrl mirrors the primary (first) image for list thumbnails.
      imageUrl: images[0] ?? dto.imageUrl ?? null,
      isAvailable: dto.isAvailable ?? true,
      sizes: this.cleanRows(dto.sizes),
      variants: this.cleanRows(dto.variants),
      addOns: this.cleanRows(dto.addOns),
    };
  }

  resolveUpdatePayload(dto: UpdateMenuItemDto): Partial<MenuItem> {
    const payload: Partial<MenuItem> = {};
    if (dto.name !== undefined) payload.name = trimSpaces(dto.name);
    if (dto.description !== undefined)
      payload.description = dto.description
        ? trimSpaces(dto.description)
        : null;
    if (dto.price !== undefined) payload.price = dto.price;
    if (dto.images !== undefined) {
      payload.images = this.cleanImages(dto.images);
      payload.imageUrl = payload.images[0] ?? null;
    } else if (dto.imageUrl !== undefined) {
      payload.imageUrl = dto.imageUrl;
    }
    if (dto.isAvailable !== undefined) payload.isAvailable = dto.isAvailable;
    if (dto.sizes !== undefined) payload.sizes = this.cleanRows(dto.sizes);
    if (dto.variants !== undefined)
      payload.variants = this.cleanRows(dto.variants);
    if (dto.addOns !== undefined) payload.addOns = this.cleanRows(dto.addOns);
    return payload;
  }

  private cleanImages(images?: string[]): string[] {
    return (images ?? []).map((u) => trimSpaces(u)).filter(Boolean);
  }

  resolveListFilters(
    query: GetMenuItemQueryDto,
    opts?: { skipAvailability?: boolean },
  ): FindOptionsWhere<MenuItem> {
    const where: FindOptionsWhere<MenuItem> = {};
    if (query.search) where.name = toILikeContains(trimSpaces(query.search));

    // Category + branch both scope via the per-branch membership M2M: a
    // categoryId/categoryIds narrows to specific categories; a branchId means
    // "carried at this branch" (in any of its categories). Items are global —
    // their branch presence lives entirely in this membership.
    const ids = (query.categoryIds ?? query.categoryId ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const categoryWhere: FindOptionsWhere<MenuItem>['categories'] = {};
    if (ids.length) categoryWhere.id = In(ids);
    if (query.branchId) categoryWhere.branchId = query.branchId;
    if (Object.keys(categoryWhere).length) where.categories = categoryWhere;

    // Branch-scoped requests fold availability in via the overlay (see
    // `branchAvailabilityWhere`), so skip the plain global-column clause there.
    if (query.isAvailable !== undefined && !opts?.skipAvailability)
      where.isAvailable = query.isAvailable === 'true';

    // Price range — any combination of min/max.
    const { minPrice, maxPrice } = query;
    if (minPrice !== undefined && maxPrice !== undefined)
      where.price = Between(minPrice, maxPrice);
    else if (minPrice !== undefined) where.price = MoreThanOrEqual(minPrice);
    else if (maxPrice !== undefined) where.price = LessThanOrEqual(maxPrice);

    return where;
  }

  /**
   * Fold per-branch availability overrides into the `isAvailable` filter for a
   * branch-scoped list. Effective availability = override ?? global, so the set
   * matching `want` is: items globally `want` and NOT overridden the other way,
   * OR items explicitly overridden to `want`. Returned as an OR-array of the
   * `base` filter (search/category/price) with the two disjoint cases.
   * `onIds`/`offIds` are the item ids overridden available/unavailable at the
   * branch (sparse — only deviations exist).
   */
  branchAvailabilityWhere(
    base: FindOptionsWhere<MenuItem>,
    want: boolean,
    onIds: string[],
    offIds: string[],
  ): FindOptionsWhere<MenuItem>[] {
    const overriddenWant = want ? onIds : offIds;
    const overriddenOther = want ? offIds : onIds;
    const clauses: FindOptionsWhere<MenuItem>[] = [
      {
        ...base,
        isAvailable: want,
        // Guard: `Not(In([]))` is NULL/unknown and would exclude everything.
        ...(overriddenOther.length ? { id: Not(In(overriddenOther)) } : {}),
      },
    ];
    if (overriddenWant.length)
      clauses.push({ ...base, id: In(overriddenWant) });
    return clauses;
  }

  private cleanRows(rows?: MenuOptionRow[]): MenuOptionRow[] {
    return (rows ?? [])
      .filter((r) => r && trimSpaces(r.name))
      .map((r) => ({ name: trimSpaces(r.name), price: Number(r.price) || 0 }));
  }
}
