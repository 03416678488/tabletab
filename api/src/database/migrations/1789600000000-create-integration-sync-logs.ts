import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIntegrationSyncLogs1789600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "integration_sync_logs" (
        "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "provider"  varchar NOT NULL,
        "direction" varchar NOT NULL,
        "status"    varchar NOT NULL,
        "message"   varchar,
        "meta"      jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_integration_sync_logs_provider_created"
       ON "integration_sync_logs" ("provider", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "integration_sync_logs"`);
  }
}
