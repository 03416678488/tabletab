import * as _ from 'lodash';

// ============================================================================
// VALIDATION
// ============================================================================

export const isString = (value: unknown): value is string => _.isString(value);

export const isNonEmptyString = (value: unknown): value is string =>
  _.isString(value) && !_.isEmpty(value);

export const isStringNotNull = (value: unknown): value is string =>
  _.isString(value) && value !== 'null' && !_.isEmpty(value);

export const areAllStringsValid = (...values: unknown[]): boolean => values.every(isStringNotNull);

// ============================================================================
// CASE CONVERSION
// ============================================================================

export const toCamelCase = (str: string): string => _.camelCase(str);

export const toPascalCase = (str: string): string => _.upperFirst(_.camelCase(str));

export const toSnakeCase = (str: string): string => _.snakeCase(str);

export const toKebabCase = (str: string): string => _.kebabCase(str);

export const toLowerCase = (str: string): string => _.toLower(str);

export const toUpperCase = (str: string): string => _.toUpper(str);

export const capitalize = (str: string): string => _.capitalize(str);

export const capitalizeWords = (str: string): string => _.startCase(_.toLower(str));

export const splitCamelCase = (str: string): string => _.startCase(str).toLowerCase();

// ============================================================================
// WHITESPACE
// ============================================================================

export const removeAllSpaces = (str: string): string =>
  isNonEmptyString(str) ? str.replace(/\s+/g, '') : '';

export const removeSpaces = (str: string): string =>
  isNonEmptyString(str) ? str.replace(/ /g, '') : '';

export const trimSpaces = (str: string): string => _.trim(str);

export const removeExtraSpaces = (str: string): string =>
  isNonEmptyString(str) ? str.replace(/\s+/g, ' ').trim() : '';

export const normalizeSpaces = removeExtraSpaces;

// ============================================================================
// FORMATTING
// ============================================================================

export const truncate = (str: string, length: number, omission: string = '...'): string =>
  _.truncate(str, {
    length,
    omission,
  });

export const padString = (
  str: string,
  length: number,
  padChar: string = ' ',
  side: 'start' | 'end' | 'both' = 'start',
): string => {
  switch (side) {
    case 'start':
      return _.padStart(str, length, padChar);

    case 'end':
      return _.padEnd(str, length, padChar);

    case 'both':
      return _.pad(str, length, padChar);

    default:
      return str;
  }
};

export const reverse = (str: string): string =>
  isString(str) ? _.reverse(str.split('')).join('') : '';

export const repeatString = (str: string, count: number): string => _.repeat(str, count);

// ============================================================================
// SEARCH & REPLACE
// ============================================================================

export const countOccurrences = (
  str: string,
  substring: string,
  caseSensitive: boolean = true,
): number => {
  if (!isNonEmptyString(str) || !isNonEmptyString(substring)) return 0;

  const source = caseSensitive ? str : _.toLower(str);
  const target = caseSensitive ? substring : _.toLower(substring);

  return source.split(target).length - 1;
};

export const contains = (
  str: string,
  substring: string,
  caseSensitive: boolean = true,
): boolean => {
  if (!isString(str) || !isString(substring)) return false;

  return caseSensitive
    ? _.includes(str, substring)
    : _.includes(_.toLower(str), _.toLower(substring));
};

export const replaceAll = (str: string, search: string, replace: string): string => {
  if (!isString(str) || !isString(search)) return str;

  return str.split(search).join(replace);
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const isEmail = (str: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

export const isUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

export const isNumeric = (str: string): boolean => /^\d+$/.test(str);

export const isAlphanumeric = (str: string): boolean => /^[a-zA-Z0-9]+$/.test(str);

export const hasEvenSpacing = (str: string, spacing: number = 1): boolean => {
  const spaces = ' '.repeat(spacing);

  return str.split(spaces).length > 1 && !str.includes(spaces + spaces);
};

// ============================================================================
// EXPORTS
// ============================================================================

export const StringUtils = {
  isString,
  isNonEmptyString,
  isStringNotNull,
  areAllStringsValid,

  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toLowerCase,
  toUpperCase,
  capitalize,
  capitalizeWords,
  splitCamelCase,

  removeAllSpaces,
  removeSpaces,
  trimSpaces,
  removeExtraSpaces,
  normalizeSpaces,

  truncate,
  padString,
  reverse,
  repeatString,

  countOccurrences,
  contains,
  replaceAll,

  isEmail,
  isUrl,
  isNumeric,
  isAlphanumeric,
  hasEvenSpacing,
};

export default StringUtils;
