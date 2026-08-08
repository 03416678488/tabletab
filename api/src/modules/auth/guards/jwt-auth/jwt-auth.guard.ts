import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@modules/auth/guards/public/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Optional authentication on public routes: if the caller sent a bearer
      // token, validate it so controllers can distinguish authenticated staff
      // from anonymous guests (e.g. order re-pricing trusts staff, re-prices
      // guests). A missing or invalid token never blocks a public route —
      // guests with no token skip auth entirely, exactly as before.
      const req = context.switchToHttp().getRequest();
      if (!req?.headers?.authorization) return true;
      try {
        await super.canActivate(context);
      } catch {
        /* invalid/expired token on a public route → continue as a guest */
      }
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
