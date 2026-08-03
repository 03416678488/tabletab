import { IsObject } from 'class-validator';

/**
 * Full replacement of a role's grants. Keys are module `resource` ids, values
 * are the allowed actions. Unknown modules/actions are dropped server-side;
 * modules omitted (or with an empty array) are revoked.
 */
export class UpdateRolePermissionsDto {
  @IsObject()
  grants: Record<string, string[]>;
}
