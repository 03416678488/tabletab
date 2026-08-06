import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIntegrations1789400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_integrations" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider"    varchar NOT NULL,
        "status"      varchar NOT NULL DEFAULT 'connected',
        "config"      jsonb,
        "connectedAt" timestamp,
        "lastSyncAt"  timestamp,
        "createdAt"   timestamp NOT NULL DEFAULT now(),
        "updatedAt"   timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tenant_integrations_provider"
       ON "tenant_integrations" ("provider")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_integrations"`);
  }
}
