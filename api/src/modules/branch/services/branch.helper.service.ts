import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Branch } from '../entities/branch.entity';
import { CreateBranchDto, UpdateBranchDto, GetBranchQueryDto } from '../dto';

/**
 * Pure "resolver" helpers for the branch module — normalization, defaults and
 * query building. Keeps BranchService focused on orchestration only.
 */
@Injectable()
export class BranchHelperService {
  /** Trim text fields and apply create-time defaults. */
  resolveCreatePayload(dto: CreateBranchDto): Partial<Branch> {
    return {
      ...dto,
      name: trimSpaces(dto.name),
      address: trimSpaces(dto.address),
      city: trimSpaces(dto.city),
      phone: trimSpaces(dto.phone),
      isOpen: dto.isOpen ?? true,
      onlineOrderingEnabled: dto.onlineOrderingEnabled ?? true,
    };
  }

  /** Trim only the text fields that were actually provided on update. */
  resolveUpdatePayload(dto: UpdateBranchDto): Partial<Branch> {
    const payload: Partial<Branch> = { ...dto };
    for (const key of ['name', 'address', 'city', 'phone'] as const) {
      if (typeof payload[key] === 'string') {
        payload[key] = trimSpaces(payload[key] as string);
      }
    }
    return payload;
  }

  /** Build the TypeORM `where` filter from the list query params. */
  resolveListFilters(query: GetBranchQueryDto): FindOptionsWhere<Branch> {
    const where: FindOptionsWhere<Branch> = {};

    if (query.name) where.name = ILike(`%${trimSpaces(query.name)}%`);
    if (query.city) where.city = ILike(`%${trimSpaces(query.city)}%`);
    if (query.isOpen !== undefined) where.isOpen = query.isOpen === 'true';

    return where;
  }
}
