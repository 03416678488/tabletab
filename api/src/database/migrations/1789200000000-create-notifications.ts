import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1789200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"    uuid NOT NULL,
        "category"  varchar NOT NULL,
        "type"      varchar NOT NULL,
        "title"     varchar NOT NULL,
        "body"      varchar,
        "data"      jsonb,
        "priority"  varchar NOT NULL DEFAULT 'normal',
        "branchId"  uuid,
        "readAt"    timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_created"
       ON "notifications" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read"
       ON "notifications" ("userId", "readAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
