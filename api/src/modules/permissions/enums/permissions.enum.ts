import { objectValues } from '@cor/helpers';

export enum PermissionsEnum {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export const VALID_ACTIONS = objectValues(PermissionsEnum);
