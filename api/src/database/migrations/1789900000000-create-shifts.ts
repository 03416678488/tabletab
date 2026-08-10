import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShifts1789900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shifts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "branchId" uuid,
        "status" varchar NOT NULL DEFAULT 'open',
        "note" varchar,
        "clockInAt" TIMESTAMP NOT NULL DEFAULT now(),
        "clockOutAt" TIMESTAMP,
        CONSTRAINT "PK_shifts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shifts_user_status" ON "shifts" ("userId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shifts_user_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shifts"`);
  }
}
