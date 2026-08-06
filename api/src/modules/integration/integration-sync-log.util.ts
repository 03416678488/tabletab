import { Repository } from 'typeorm';

import {
  IntegrationSyncLog,
  SyncDirection,
  SyncStatus,
} from './entities/integration-sync-log.entity';

export interface SyncLogEntry {
  provider: string;
  direction: SyncDirection;
  status: SyncStatus;
  message?: string | null;
  meta?: Record<string, unknown> | null;
}

/** Write a sync-log row. Best-effort — logging must never break the flow. */
export async function writeSyncLog(
  repo: Repository<IntegrationSyncLog>,
  entry: SyncLogEntry,
): Promise<void> {
  try {
    await repo.save(
      repo.create({
        provider: entry.provider,
        direction: entry.direction,
        status: entry.status,
        message: entry.message ?? null,
        meta: entry.meta ?? null,
      }),
    );
  } catch {
    // swallow — the log is auxiliary
  }
}
