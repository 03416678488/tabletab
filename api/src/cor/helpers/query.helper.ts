import { FindOperator, ILike, Like } from 'typeorm';

/**
 * Escape LIKE/ILIKE wildcards (`%`, `_`) and the escape char itself so user
 * input matches literally. Without this, a search for "%" scans every row and
 * a literal "50%" can never be found. Injection is already prevented by
 * parameterization — this is about correct, bounded matching.
 */
export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export const toLikeOperator = (value: string): FindOperator<string> => {
  return Like(`%${escapeLikePattern(value)}%`);
};
export const toILikeOperator = (value: string): string => {
  return `%${escapeLikePattern(value)}%`;
};
/** Case-insensitive "contains" with wildcards escaped — use for search boxes. */
export const toILikeContains = (value: string): FindOperator<string> => {
  return ILike(`%${escapeLikePattern(value)}%`);
};
export const toEqualOperator = (value: string | number): string | number => {
  return value;
};
export const toNotEqualOperator = (value: string | number): string | number => {
  return value;
};
export const toGreaterThanOperator = (value: string | number): string | number => {
  return value;
};
export const toLessThanOperator = (value: string | number): string | number => {
  return value;
};
export const toGreaterThanOrEqualOperator = (value: string | number): string | number => {
  return value;
};
export const toLessThanOrEqualOperator = (value: string | number): string | number => {
  return value;
};
export const toInOperator = (
  value: string | number | Array<string | number>,
): Array<string | number> => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};
export const toNotInOperator = (
  value: string | number | Array<string | number>,
): Array<string | number> => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};
export const toIsNullOperator = (): null => {
  return null;
};
export const toIsNotNullOperator = (): null => {
  return null;
};
