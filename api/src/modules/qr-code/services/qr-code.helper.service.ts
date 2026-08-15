import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { QrCode } from '../entities/qr-code.entity';
import { CreateQrCodeDto, UpdateQrCodeDto, GetQrCodeQueryDto } from '../dto';
import { toILikeContains } from '@cor/helpers/query.helper';

/** Pure resolver helpers — token generation, defaults and query building. */
@Injectable()
export class QrCodeHelperService {
  /** Short, URL-safe token for the scan link (base36, ~12 chars). */
  generateSlug(): string {
    return randomBytes(9)
      .toString('base64url')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  resolveCreatePayload(dto: CreateQrCodeDto): Partial<QrCode> {
    const kind = dto.kind ?? 'table';
    if (kind === 'custom') {
      return {
        kind: 'custom',
        tableId: null,
        branchId: dto.branchId ?? null,
        label: trimSpaces(dto.label ?? '') || null,
        customType: (dto.customType as QrCode['customType']) ?? 'url',
        content: (dto.content ?? '').trim(),
        isActive: dto.isActive ?? true,
        slug: this.generateSlug(),
      };
    }
    return {
      kind: 'table',
      tableId: dto.tableId,
      isActive: dto.isActive ?? true,
      slug: this.generateSlug(),
    };
  }

  resolveUpdatePayload(dto: UpdateQrCodeDto): Partial<QrCode> {
    const payload: Partial<QrCode> = {};
    if (dto.tableId !== undefined) payload.tableId = dto.tableId;
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;
    if (dto.label !== undefined) payload.label = trimSpaces(dto.label) || null;
    if (dto.customType !== undefined)
      payload.customType = dto.customType as QrCode['customType'];
    if (dto.content !== undefined) payload.content = dto.content.trim();
    return payload;
  }

  resolveListFilters(
    query: GetQrCodeQueryDto,
  ): FindOptionsWhere<QrCode> | FindOptionsWhere<QrCode>[] {
    const base: FindOptionsWhere<QrCode> = {};
    if (query.search) base.slug = toILikeContains(trimSpaces(query.search));
    if (query.tableId) base.tableId = query.tableId;
    if (query.isActive !== undefined) base.isActive = query.isActive === 'true';

    const tableWhere: FindOptionsWhere<QrCode>['table'] = {};
    if (query.areaId) tableWhere.areaId = query.areaId;
    if (query.branchId) tableWhere.branchId = query.branchId;
    if (Object.keys(tableWhere).length === 0) return base;

    // Branch scope (OR'd): custom codes filter by their OWN branchId, table
    // codes by their table's branch. A specific branch shows only its own codes
    // (null-branch legacy customs show only under "All branches").
    const clauses: FindOptionsWhere<QrCode>[] = [
      { ...base, kind: 'table', table: tableWhere },
    ];
    if (query.branchId) {
      clauses.push({ ...base, kind: 'custom', branchId: query.branchId });
    }
    return clauses;
  }
}
