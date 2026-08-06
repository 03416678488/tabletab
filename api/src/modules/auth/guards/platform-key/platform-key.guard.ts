import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Authorizes control-plane → tenant service calls (e.g. impersonation) via a
 * shared secret in `x-platform-key`. The restaurant API doesn't know platform
 * admins, so the console proves it's the platform with this key.
 */
@Injectable()
export class PlatformKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const expected = process.env.PLATFORM_IMPERSONATION_KEY;
    if (!expected) {
      throw new ForbiddenException('Impersonation is not configured');
    }
    const provided = req.headers['x-platform-key'];
    if (typeof provided !== 'string' || !constantTimeEquals(provided, expected)) {
      throw new ForbiddenException('Invalid platform key');
    }
    return true;
  }
}

/** Compare secrets without leaking length/prefix timing information. */
function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
