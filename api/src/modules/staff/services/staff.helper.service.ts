import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike } from 'typeorm';

import { toLowerCase, trimSpaces } from '@cor/helpers';

import { Staff } from '../entities/staff.entity';
import { StaffRoleEnum } from '../enums/staff-role.enum';
import { CreateStaffDto, UpdateStaffDto, GetStaffQueryDto } from '../dto';

/**
 * Pure "resolver" helpers for the staff module — normalization, defaults and
 * query building. Keeps StaffService focused on orchestration only.
 */
@Injectable()
export class StaffHelperService {
  /** Trim/normalize fields and apply create-time defaults. */
  resolveCreatePayload(dto: CreateStaffDto): Partial<Staff> {
    return {
      ...dto,
      firstName: trimSpaces(dto.firstName),
      lastName: trimSpaces(dto.lastName),
      email: this.normalizeEmail(dto.email),
      phone: dto.phone ? trimSpaces(dto.phone) : undefined,
      role: dto.role ?? StaffRoleEnum.WAITER,
      isActive: dto.isActive ?? true,
    };
  }

  /** Trim/normalize only the fields provided on update. */
  resolveUpdatePayload(dto: UpdateStaffDto): Partial<Staff> {
    const payload: Partial<Staff> = { ...dto };
    for (const key of ['firstName', 'lastName', 'phone'] as const) {
      if (typeof payload[key] === 'string') {
        payload[key] = trimSpaces(payload[key] as string);
      }
    }
    if (typeof payload.email === 'string') {
      payload.email = this.normalizeEmail(payload.email);
    }
    return payload;
  }

  /** Build the TypeORM `where` filter from the list query params. */
  resolveListFilters(
    query: GetStaffQueryDto,
  ): FindOptionsWhere<Staff> | FindOptionsWhere<Staff>[] {
    const base: FindOptionsWhere<Staff> = {};
    if (query.role) base.role = query.role;
    if (query.branchId) base.branchId = query.branchId;
    if (query.isActive !== undefined) base.isActive = query.isActive === 'true';

    const term = query.search ? trimSpaces(query.search) : '';
    if (!term) return base;

    // Search across name / email / phone.
    const like = ILike(`%${term}%`);
    return [
      { ...base, firstName: like },
      { ...base, lastName: like },
      { ...base, email: like },
      { ...base, phone: like },
    ];
  }

  normalizeEmail(email: string): string {
    return trimSpaces(toLowerCase(email));
  }
}
