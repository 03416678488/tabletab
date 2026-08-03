import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsArray } from 'class-validator';

export function ParseToArray(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }) => {
      if (!value) return [];
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return [];
      }
    }),
    IsArray(),
  );
}
