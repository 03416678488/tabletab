import { MigrationInterface, QueryRunner } from 'typeorm';

/** Per-branch flag: whether guests can request event bookings. */
export class BranchEventsEnabled1795000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "eventsEnabled" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "eventsEnabled"`,
    );
  }
}
