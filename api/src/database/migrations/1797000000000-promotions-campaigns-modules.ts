import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Promotions + Campaigns became their own permission modules (previously folded
 * into `settings`, which made them owner-only). Grant them to Owner + both
 * Manager roles so managers can manage marketing. Idempotent.
 */
const CRUD = '["create","read","update","delete"]';
const MANAGER_ROLES = ['Owner', 'Multi Branch Manager', 'Branch Manager'];
const NEW_MODULES = ['promotions', 'campaigns'];

export class PromotionsCampaignsModules1797000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}
