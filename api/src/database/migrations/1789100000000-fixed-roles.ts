import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Transition to the fixed role set: Owner, Multi Branch Manager, Branch Manager,
 * Chef, Waiter, Delivery Rider, Customer.
 *
 * Renames are used where an old role maps 1:1 to a new one so that every
 * existing `role_permissions` row and user↔role link is preserved (the role id
 * is unchanged). The two new manager roles are inserted, and the obsolete roles
 * are dropped — their `role_permissions` and `user_role_permissions` rows fall
 * away via the `onDelete: CASCADE` foreign keys.
 *
 * Idempotent and safe on both fresh and already-seeded databases.
 */
const RENAMES: [from: string, to: string][] = [
  ['Administrators', 'Owner'],
  ['Delivery Boys', 'Delivery Rider'],
  ['Waiters', 'Waiter'],
  ['Chefs', 'Chef'],
  ['Customers', 'Customer'],
];

const TARGET_ROLES = [
  'Owner',
  'Multi Branch Manager',
  'Branch Manager',
  'Chef',
  'Waiter',
  'Delivery Rider',
  'Customer',
];

const OBSOLETE_ROLES = ['Super Admin', 'Admin', 'Employees', 'User'];

export class FixedRoles1789100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename mappable roles (only when the target name is still free).
    for (const [from, to] of RENAMES) {
      await queryRunner.query(
        `UPDATE "roles" SET "name" = $1, "updatedAt" = now()
         WHERE "name" = $2
           AND NOT EXISTS (SELECT 1 FROM "roles" WHERE "name" = $1)`,
        [to, from],
      );
    }

    // 2. Ensure every target role exists (covers fresh/partial databases).
    for (const name of TARGET_ROLES) {
      await queryRunner.query(
        `INSERT INTO "roles" ("name", "createdAt", "updatedAt")
         VALUES ($1, now(), now())
         ON CONFLICT ("name") DO NOTHING`,
        [name],
      );
    }

    // 3. Drop retired roles. The DB foreign keys on the link tables are NOT all
    //    ON DELETE CASCADE, so clear the dependent rows explicitly first.
    await queryRunner.query(
      `DELETE FROM "user_role_permissions"
       WHERE "roleId" IN (SELECT "id" FROM "roles" WHERE "name" = ANY($1))`,
      [OBSOLETE_ROLES],
    );
    await queryRunner.query(
      `DELETE FROM "role_permissions"
       WHERE "roleId" IN (SELECT "id" FROM "roles" WHERE "name" = ANY($1))`,
      [OBSOLETE_ROLES],
    );
    await queryRunner.query(
      `DELETE FROM "roles" WHERE "name" = ANY($1)`,
      [OBSOLETE_ROLES],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort reversal of the renames; the two new manager roles and the
    // dropped legacy roles are left as-is (their data cannot be reconstructed).
    for (const [from, to] of RENAMES) {
      await queryRunner.query(
        `UPDATE "roles" SET "name" = $1, "updatedAt" = now()
         WHERE "name" = $2
           AND NOT EXISTS (SELECT 1 FROM "roles" WHERE "name" = $1)`,
        [from, to],
      );
    }
  }
}
