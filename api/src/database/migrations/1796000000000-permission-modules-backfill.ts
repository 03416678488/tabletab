import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfill grants for the modules added to the permission catalog
 * (reservations, events, vat) so existing roles keep access after API-level
 * enforcement lands, and give the Chef `orders:update` (KDS advances a ticket's
 * status via PUT /orders/:id). Idempotent — safe to run on already-seeded DBs.
 */
const CRUD = '["create","read","update","delete"]';
const MANAGER_ROLES = ['Owner', 'Multi Branch Manager', 'Branch Manager'];
const NEW_MODULES = ['reservations', 'events', 'vat'];

export class PermissionModulesBackfill1796000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Owner + both Managers get full CRUD on the new modules (don't clobber any
    // grant an admin already customised).
    for (const role of MANAGER_ROLES) {
      for (const mod of NEW_MODULES) {
        await queryRunner.query(
          `INSERT INTO role_permissions ("roleId", resource, actions)
           SELECT r.id, $1, $2::json FROM roles r WHERE r.name = $3
           ON CONFLICT ("roleId", resource) DO NOTHING`,
          [mod, CRUD, role],
        );
      }
    }

    // Waiters manage reservations (the Reservations screen is in their nav).
    await queryRunner.query(
      `INSERT INTO role_permissions ("roleId", resource, actions)
       SELECT r.id, 'reservations', $1::json FROM roles r WHERE r.name = 'Waiter'
       ON CONFLICT ("roleId", resource) DO NOTHING`,
      [CRUD],
    );

    // Chef needs orders:update for KDS status changes (previously read-only).
    await queryRunner.query(
      `INSERT INTO role_permissions ("roleId", resource, actions)
       SELECT r.id, 'orders', $1::json FROM roles r WHERE r.name = 'Chef'
       ON CONFLICT ("roleId", resource) DO UPDATE SET actions = $1::json`,
      ['["read","update"]'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const role of MANAGER_ROLES) {
      await queryRunner.query(
        `DELETE FROM role_permissions
         WHERE resource = ANY($1)
           AND "roleId" IN (SELECT id FROM roles WHERE name = $2)`,
        [NEW_MODULES, role],
      );
    }
    await queryRunner.query(
      `UPDATE role_permissions SET actions = '["read"]'::json
       FROM roles r
       WHERE role_permissions."roleId" = r.id
         AND r.name = 'Chef' AND role_permissions.resource = 'orders'`,
    );
  }
}
