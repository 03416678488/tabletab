import { FindOptionsWhere, ILike, LessThan, MoreThan, Not } from 'typeorm';
import { escapeLikePattern } from '@cor/helpers/query.helper';
import { ParsedCondition } from './parse-filter-query';

export function conditionsToWhere<T>(
  conditions: ParsedCondition[],
  allowedFields: (keyof T)[],
): FindOptionsWhere<T> {
  const allowed = new Set(allowedFields as string[]);
  const where: Record<string, unknown> = {};

  for (const c of conditions) {
    if (!allowed.has(c.field)) continue;

    switch (c.operator) {
      case 'is':
        where[c.field] = c.value;
        break;
      case 'is_not':
        where[c.field] = Not(c.value);
        break;
      case 'contains':
        where[c.field] = ILike(`%${escapeLikePattern(String(c.value))}%`);
        break;
      case 'starts_with':
        where[c.field] = ILike(`${escapeLikePattern(String(c.value))}%`);
        break;
      case 'ends_with':
        where[c.field] = ILike(`%${escapeLikePattern(String(c.value))}`);
        break;
      case 'greater_than':
        where[c.field] = MoreThan(c.value);
        break;
      case 'less_than':
        where[c.field] = LessThan(c.value);
        break;
      default:
        break;
    }
  }

  return where as FindOptionsWhere<T>;
}
