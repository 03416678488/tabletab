import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

export function StringToNull(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }) => {
      if (value === '' || value === "''") {
        return null;
      }
      return value;
    }),
  );
}
