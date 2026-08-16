import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove the Kiosk Machines feature. The settings tab, admin UI, and backend
 * module are gone; drop its table too. (The original create migration also
 * created analytics/timeslots tables, so it can't be reverted — this only drops
 * `kiosk_machines`.)
 */
export class DropKioskMachines1794200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "kiosk_machines"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create a minimal table shell (feature removed; kept for reversibility).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kiosk_machines" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "location" varchar,
        "code" varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "branchId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);
  }
}
