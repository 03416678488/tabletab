import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ClientIp = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();

  // You can customize IP extraction logic here
  const ip =
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.socket?.remoteAddress ||
    request.ip;

  return ip;
});
