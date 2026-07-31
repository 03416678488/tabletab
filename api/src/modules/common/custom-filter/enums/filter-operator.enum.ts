/**
 * Operators supported by the query-string filter parser.
 * String values must stay in sync with the switch in cor/query/conditions-to-where.ts.
 */
export enum FilterOperatorEnum {
  IS = 'is',
  IS_NOT = 'is_not',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
}
