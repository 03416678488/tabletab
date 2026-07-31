import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { getDateFromTimestamp } from '@cor/helpers/date.helpers';
import { isStringNotNull } from '@cor/helpers/string.helpers';

export function ParseCreatedAtDate(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }) => {
      if (!isStringNotNull(value)) return null;

      const dates = value.split(',').map((timeStamp) => {
        const parsedDate = new Date(+timeStamp || timeStamp);
        if (isNaN(parsedDate.getTime())) {
          return null;
        }
        return getDateFromTimestamp(parsedDate);
      });

      return {
        from: dates[0],
        to: dates[1] ?? null,
      };
    }),
  );
}
