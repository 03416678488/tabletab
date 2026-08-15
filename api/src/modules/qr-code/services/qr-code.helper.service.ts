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
    return {
      tableId: dto.tableId,
      isActive: dto.isActive ?? true,
      slug: this.generateSlug(),
    };
  }

  resolveUpdatePayload(dto: UpdateQrCodeDto): Partial<QrCode> {
    const payload: Partial<QrCode> = {};
    if (dto.tableId !== undefined) payload.tableId = dto.tableId;
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;
    return payload;
  }

  resolveListFilters(query: GetQrCodeQueryDto): FindOptionsWhere<QrCode> {
    const where: FindOptionsWhere<QrCode> = {};
    if (query.search) where.slug = toILikeContains(trimSpaces(query.search));
    if (query.tableId) where.tableId = query.tableId;
    if (query.isActive !== undefined)
      where.isActive = query.isActive === 'true';

    const tableWhere: FindOptionsWhere<QrCode>['table'] = {};
    if (query.areaId) tableWhere.areaId = query.areaId;
    if (query.branchId) tableWhere.branchId = query.branchId;
    if (Object.keys(tableWhere).length > 0) where.table = tableWhere;

    return where;
  }
}
