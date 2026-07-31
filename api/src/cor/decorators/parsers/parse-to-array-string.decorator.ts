import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export function ParseToArrayString(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }) => {
      if (!value) return [];
      return value
        .split(',')
        .filter((entity) => entity !== '' && entity !== 'null' && entity !== 'undefined')
        .map((entity) => entity.trim());
    }),
    IsArray(),
    IsString({ each: true }),
  );
}
