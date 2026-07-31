import { FilterOperatorEnum } from '../../modules/common/custom-filter/enums/filter-operator.enum';

const RESERVED_KEYS = new Set([
  'filterId',
  'tab',
  'q',
  'page',
  'perPage',
  'sortBy',
  'sortOrder',
  'sort',
]);
import { objectValues } from '@cor/helpers';

const DEFAULT_OPERATOR: FilterOperatorEnum = FilterOperatorEnum.IS;

export interface ParsedCondition {
  field: string;
  operator: FilterOperatorEnum;
  value: string;
}

export function parseFilterQuery(
  query: Record<string, string | string[] | undefined>,
): ParsedCondition[] {
  const allowedOperators = new Set(objectValues(FilterOperatorEnum));
  const conditions: ParsedCondition[] = [];

  for (const [key, raw] of Object.entries(query)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (raw === undefined || raw === '') continue;

    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) continue;

    const [field, op] = key.includes('__') ? key.split('__', 2) : [key, DEFAULT_OPERATOR];

    if (!allowedOperators.has(op as FilterOperatorEnum)) continue;

    conditions.push({
      field,
      operator: op as FilterOperatorEnum,
      value,
    });
  }

  return conditions;
}
