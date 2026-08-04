import { Injectable } from '@nestjs/common';
import { RedisService } from '@services/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Check email code request cooldown (60 seconds)
   */
  async checkEmailCodeRequestCooldown(email: string): Promise<boolean> {
    const key = `cooldown:email:${email}`;

    // Check if cooldown exists
    const exists = await this.redisService.exists(key);
    if (exists) {
      return false; // In cooldown
    }

    // Set cooldown for 60 seconds
    await this.redisService.save(key, '1', 60);
    return true; // Allowed
  }

  /**
   * Check daily email request limit (default 5 per day)
   */
  async checkEmailDailyCodeRequestLimit(email: string, limit: number = 5): Promise<boolean> {
    const key = `limit:daily:email:${email}`;

    // Get current count
    const countStr = await this.redisService.get(key, false);
    const count = parseInt(countStr || '0', 10);

    // Check if limit exceeded
    if (count >= limit) {
      return false;
    }

    // Increment counter
    const newCount = count + 1;

    // Save with 24-hour expiry (only set expiry on first request)
    if (count === 0) {
      await this.redisService.save(key, newCount.toString(), 24 * 60 * 60);
    } else {
      // Update without changing expiry
      await this.redisService.save(key, newCount.toString());
    }

    return true;
  }

  /**
   * Check IP-based request limit (default 10 per hour)
   */
  async checkIPCodeRequestLimit(ip: string, limit: number = 10): Promise<boolean> {
    const key = `limit:ip:${ip}`;

    // Get current count
    const countStr = await this.redisService.get(key, false);
    const count = parseInt(countStr || '0', 10);

    // Check if limit exceeded
    if (count >= limit) {
      console.log(`[RATE_LIMIT] IP limit exceeded for ${ip}: ${count}/${limit}`);
      return false;
    }

    // Increment counter
    const newCount = count + 1;

    // Save with 1-hour expiry (only set expiry on first request)
    if (count === 0) {
      await this.redisService.save(key, newCount.toString(), 60 * 60);
    } else {
      // Update without changing expiry
      await this.redisService.save(key, newCount.toString());
    }

    return true;
  }

  /**
   * Check login attempts (default 5 per hour)
   */
  async checkLoginAttempts(email: string, limit: number = 5): Promise<boolean> {
    const key = `login:attempts:${email}`;

    // Get current count
    const countStr = await this.redisService.get(key, false);
    const count = parseInt(countStr || '0', 10);

    // Check if limit exceeded
    if (count >= limit) {
      return false;
    }

    // Increment counter
    const newCount = count + 1;

    // Save with 1-hour expiry (only set expiry on first request)
    if (count === 0) {
      await this.redisService.save(key, newCount.toString(), 60 * 60);
    } else {
      await this.redisService.save(key, newCount.toString());
    }

    return true;
  }

  /**
   * Reset login attempts for an email
   */
  async resetLoginAttempts(email: string): Promise<void> {
    const key = `login:attempts:${email}`;
    await this.redisService.delete(key);
  }

  /**
   * Increment failed verification attempt
   */
  async incrementFailedVerificationAttempt(
    userId: string,
    type: 'email' | 'reset',
  ): Promise<number> {
    const key = `verify:attempts:${type}:${userId}`;

    // Get current count
    const countStr = await this.redisService.get(key, false);
    const count = parseInt(countStr || '0', 10);

    // Increment
    const newCount = count + 1;

    // Save without expiry (handled by separate lock key)
    await this.redisService.save(key, newCount.toString());

    return newCount;
  }

  /**
   * Reset failed verification attempts
   */
  async resetFailedVerificationAttempts(userId: string, type: 'email' | 'reset'): Promise<void> {
    const key = `verify:attempts:${type}:${userId}`;
    await this.redisService.delete(key);
  }

  /**
   * Check verification lockout status
   */
  async checkVerificationLockout(
    userId: string,
    type: 'email' | 'reset',
    maxAttempts: number = 5,
  ): Promise<{
    isLocked: boolean;
    attemptsRemaining: number;
    lockedUntil?: Date;
  }> {
    const attemptKey = `verify:attempts:${type}:${userId}`;
    const lockKey = `verify:lock:${type}:${userId}`;

    // Get attempts and lock status
    const [attemptsStr, lockedUntilStr] = await Promise.all([
      this.redisService.get(attemptKey, false),
      this.redisService.get(lockKey, false),
    ]);

    // Check if locked
    if (lockedUntilStr) {
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockedUntil: new Date(Number(lockedUntilStr)),
      };
    }

    // Calculate remaining attempts
    const used = parseInt(attemptsStr || '0', 10);
    const remaining = Math.max(0, maxAttempts - used);

    return {
      isLocked: false,
      attemptsRemaining: remaining,
    };
  }

  /**
   * Lock verification for a user
   */
  async lockVerification(
    userId: string,
    type: 'email' | 'reset',
    durationMinutes: number = 15,
  ): Promise<void> {
    const key = `verify:lock:${type}:${userId}`;
    const until = Date.now() + durationMinutes * 60 * 1000;

    // Save lock with expiry
    await this.redisService.save(key, until.toString(), durationMinutes * 60);
  }

  /**
   * Clear all limits for an email
   */
  async clearEmailLimits(email: string): Promise<void> {
    await this.redisService.delete(`cooldown:email:${email}`);
    await this.redisService.delete(`limit:daily:email:${email}`);
    await this.redisService.delete(`login:attempts:${email}`);
  }
}
