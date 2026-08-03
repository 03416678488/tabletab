import * as _ from 'lodash';

// --------------------------------------------------
// TYPE CHECK HELPERS (Lodash Versions)
// --------------------------------------------------

export const isArray = (entity: any): entity is any[] => _.isArray(entity);

export const isObject = (entity: any): entity is Record<string, any> => _.isPlainObject(entity);

// --------------------------------------------------
// EMPTY / NOT EMPTY CHECKS (Lodash Versions)
// --------------------------------------------------

export const notEmpty = (entity: any): boolean => !_.isEmpty(entity);

export const empty = (entity: any): boolean => _.isEmpty(entity);

// --------------------------------------------------
// OMIT KEYS (Lodash Version)
// --------------------------------------------------

// Equivalent of your omitKeys
export const omitKeys = (target: Record<string, any>, keys: string[]): Record<string, any> =>
  _.omit(target, keys);

// --------------------------------------------------
// DEEP OMIT (Using Lodash's omit + recursion)
// --------------------------------------------------

export const omitDeep = <T>(obj: T, keysToOmit: string[]): T => {
  const recurse = (value: any): any => {
    if (_.isArray(value)) {
      return value.map(recurse);
    }
    if (_.isPlainObject(value)) {
      const cleaned = _.omit(value, keysToOmit);
      return _.mapValues(cleaned, recurse);
    }
    return value;
  };

  return recurse(obj) as T;
};

// --------------------------------------------------
// OBJECT KEYS
// --------------------------------------------------

export const objectToKeys = (obj: object): string[] => _.keys(obj);

// --------------------------------------------------
// CONVERT SET TO ARRAY
// --------------------------------------------------

export const convertToArray = <T>(set: Set<T>): T[] => _.toArray(set);

// --------------------------------------------------
// NOT UNDEFINED
// --------------------------------------------------

export const notUndefined = (attr: any): boolean => !_.isUndefined(attr);

// --------------------------------------------------
// GET LENGTH
// --------------------------------------------------

export const getLength = (attr: any): number => (_.isNil(attr) ? 0 : _.size(attr));

export const objectValues = <T extends object>(obj: T) => Object.values(obj);
