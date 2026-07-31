import { FindOperator, Like } from 'typeorm';

export const toLikeOperator = (value: string): FindOperator<string> => {
  return Like(`%${value}%`);
};
export const toILikeOperator = (value: string): string => {
  return `%${value}%`;
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
