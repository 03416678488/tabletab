import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

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
    if (provided !== expected) {
      throw new ForbiddenException('Invalid platform key');
    }
    return true;
  }
}
