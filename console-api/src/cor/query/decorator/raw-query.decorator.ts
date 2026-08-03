import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RawQuery = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Record<string, string> => {
    const req = ctx.switchToHttp().getRequest();
    const queryString = req.url?.split('?')[1] ?? '';
    return Object.fromEntries(new URLSearchParams(queryString));
  },
);
