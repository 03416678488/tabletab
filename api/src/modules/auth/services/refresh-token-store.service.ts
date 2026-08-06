import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@services/redis.service';

import { TenantClaim } from '../types/auth-jwtPayload';

/**
 * How long a *just-rotated* refresh token stays acceptable. Covers the race
 * where two tabs refresh concurrently: the loser presents the previous jti a
 * moment after the winner rotated it, which must not be treated as theft.
 */
const ROTATION_GRACE_MS = 60_000;

export type RotateResult =
  /** Presented token is current → rotated to the new jti. */
  | 'rotated'
  /** Presented token was rotated moments ago (concurrent refresh) → still OK. */
  | 'grace'
  /** Presented token is stale beyond grace → replay/theft; family revoked. */
  | 'reused'
  /** No session record (revoked, expired, or pre-rotation token) → re-login. */
  | 'missing'
  /** Redis is down — allow without rotating rather than logging everyone out. */
  | 'unavailable';

interface SessionRecord {
  /** The jti of the one currently-valid refresh token in this family. */
  jti: string;
  /** The previously-valid jti, tolerated briefly (see ROTATION_GRACE_MS). */
  prev?: string;
  /** Epoch ms until which `prev` is still accepted. */
  prevExp?: number;
}

/**
 * Server-side registry of refresh-token sessions ("families"), enabling
 * rotation with reuse detection. One login = one family (`sid`); each refresh
 * replaces the family's valid `jti`. A refresh token whose jti no longer
 * matches was already spent — someone is replaying it — so the whole family is
 * revoked and both parties must re-authenticate.
 */
@Injectable()
export class RefreshTokenStoreService {
  private readonly logger = new Logger(RefreshTokenStoreService.name);

  constructor(private readonly _redis: RedisService) {}

  private key(tenant: TenantClaim | null | undefined, userId: string, sid: string): string {
    return `refresh:session:${tenant?.slug ?? 'global'}:${userId}:${sid}`;
  }

  /** Register a new session family at login. */
  async create(
    tenant: TenantClaim | null | undefined,
    userId: string,
    sid: string,
    jti: string,
    ttlSeconds: number,
  ): Promise<void> {
    const record: SessionRecord = { jti };
    await this._redis.save(this.key(tenant, userId, sid), record, ttlSeconds);
  }

  /**
   * Validate the presented jti and rotate the family to `newJti`.
   * The caller decides which jti to embed in the response tokens:
   * `newJti` on 'rotated', the returned `currentJti` on 'grace'/'unavailable'.
   */
  async rotate(
    tenant: TenantClaim | null | undefined,
    userId: string,
    sid: string,
    presentedJti: string,
    newJti: string,
    ttlSeconds: number,
  ): Promise<{ result: RotateResult; currentJti?: string }> {
    if (!this._redis.isReady()) {
      this.logger.warn('Redis unavailable — refresh allowed without rotation');
      return { result: 'unavailable', currentJti: presentedJti };
    }

    const key = this.key(tenant, userId, sid);
    const record = await this._redis.get<SessionRecord>(key, true);
    if (!record || typeof record !== 'object' || !record.jti) {
      return { result: 'missing' };
    }

    if (presentedJti === record.jti) {
      const next: SessionRecord = {
        jti: newJti,
        prev: record.jti,
        prevExp: Date.now() + ROTATION_GRACE_MS,
      };
      await this._redis.save(key, next, ttlSeconds);
      return { result: 'rotated', currentJti: newJti };
    }

    if (
      record.prev &&
      presentedJti === record.prev &&
      record.prevExp &&
      Date.now() < record.prevExp
    ) {
      // Concurrent refresh — hand back the current jti without rotating again
      // so all clients converge on a single valid chain.
      return { result: 'grace', currentJti: record.jti };
    }

    // A jti we rotated away from (beyond grace) is being replayed: assume the
    // token leaked and kill the entire family.
    await this._redis.delete(key);
    this.logger.warn(
      `[SECURITY] Refresh token reuse detected — revoked session family. user=${userId} sid=${sid} tenant=${tenant?.slug ?? 'global'}`,
    );
    return { result: 'reused' };
  }

  /** Revoke one session family (logout, or reuse detection). */
  async revoke(
    tenant: TenantClaim | null | undefined,
    userId: string,
    sid: string,
  ): Promise<void> {
    await this._redis.delete(this.key(tenant, userId, sid));
  }
}
