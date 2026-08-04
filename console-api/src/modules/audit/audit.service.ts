import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from './entities/audit-log.entity';

export interface RecordAuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

export interface ListAuditQuery {
  action?: string;
  targetId?: string;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly _repo: Repository<AuditLog>,
  ) {}

  /** Persist an audit entry. Best-effort — auditing must never break a request. */
  async record(input: RecordAuditInput): Promise<void> {
    try {
      await this._repo.insert({
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        summary: input.summary ?? null,
        metadata: input.metadata ?? null,
        ip: input.ip ?? null,
      });
    } catch (err) {
      this.logger.warn(`Failed to write audit log (${input.action}): ${(err as Error).message}`);
    }
  }

  async list(query: ListAuditQuery = {}): Promise<AuditLog[]> {
    const qb = this._repo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .limit(Math.min(Math.max(query.limit ?? 100, 1), 500));
    if (query.action) qb.andWhere('a.action = :action', { action: query.action });
    if (query.targetId) qb.andWhere('a.targetId = :targetId', { targetId: query.targetId });
    return qb.getMany();
  }
}
