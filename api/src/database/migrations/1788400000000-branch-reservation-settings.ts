import { MigrationInterface, QueryRunner } from 'typeorm';

export class BranchReservationSettings1788400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "reservationsEnabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "reservationTurnMins" int NOT NULL DEFAULT 90`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "reservationReminderLeadMins" int NOT NULL DEFAULT 30`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "reservationNoShowGraceMins" int NOT NULL DEFAULT 15`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "reservationBookingWindowDays" int NOT NULL DEFAULT 14`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "reservationCutoffMins" int NOT NULL DEFAULT 60`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of [
      'reservationsEnabled',
      'reservationTurnMins',
      'reservationReminderLeadMins',
      'reservationNoShowGraceMins',
      'reservationBookingWindowDays',
      'reservationCutoffMins',
    ]) {
      await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN IF EXISTS "${col}"`);
    }
  }
}
