import { Injectable } from '@nestjs/common';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
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
      categoryId: dto.categoryId ?? null,
      sizes: this.cleanRows(dto.sizes),
      variants: this.cleanRows(dto.variants),
      addOns: this.cleanRows(dto.addOns),
      branchId: dto.branchId ?? null,
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
    if (dto.categoryId !== undefined)
      payload.categoryId = dto.categoryId ?? null;
    if (dto.sizes !== undefined) payload.sizes = this.cleanRows(dto.sizes);
    if (dto.variants !== undefined)
      payload.variants = this.cleanRows(dto.variants);
    if (dto.addOns !== undefined) payload.addOns = this.cleanRows(dto.addOns);
    return payload;
  }

  private cleanImages(images?: string[]): string[] {
    return (images ?? []).map((u) => trimSpaces(u)).filter(Boolean);
  }

  resolveListFilters(query: GetMenuItemQueryDto): FindOptionsWhere<MenuItem> {
    const where: FindOptionsWhere<MenuItem> = {};
    if (query.search) where.name = toILikeContains(trimSpaces(query.search));

    // Multi-category (categoryIds) takes precedence over the single categoryId.
    const ids = query.categoryIds
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids && ids.length) where.categoryId = In(ids);
    else if (query.categoryId) where.categoryId = query.categoryId;

    if (query.isAvailable !== undefined)
      where.isAvailable = query.isAvailable === 'true';

    // Price range — any combination of min/max.
    const { minPrice, maxPrice } = query;
    if (minPrice !== undefined && maxPrice !== undefined)
      where.price = Between(minPrice, maxPrice);
    else if (minPrice !== undefined) where.price = MoreThanOrEqual(minPrice);
    else if (maxPrice !== undefined) where.price = LessThanOrEqual(maxPrice);

    if (query.branchId) where.branchId = query.branchId;

    return where;
  }

  private cleanRows(rows?: MenuOptionRow[]): MenuOptionRow[] {
    return (rows ?? [])
      .filter((r) => r && trimSpaces(r.name))
      .map((r) => ({ name: trimSpaces(r.name), price: Number(r.price) || 0 }));
  }
}
