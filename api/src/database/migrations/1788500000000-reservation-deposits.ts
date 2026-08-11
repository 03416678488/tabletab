import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reservation booking-deposit earnings.
 *
 * - `branches.reservationDepositPerGuest` — the per-guest deposit staff collect
 *   to hold a booking (0 = no deposit).
 * - `reservations.deposit*` — the amount/method/time actually collected when a
 *   host confirms the booking. Recording a deposit also posts a
 *   `reservation_deposit` transaction (see the transaction ledger), which is
 *   what reports/dashboard aggregate.
 */
export class ReservationDeposits1788500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "reservationDepositPerGuest" double precision NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "depositAmount" double precision NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "depositMethod" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "depositCollectedAt" timestamptz`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "reservationDepositPerGuest"`,
    );
    for (const col of [
      'depositAmount',
      'depositMethod',
      'depositCollectedAt',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "reservations" DROP COLUMN IF EXISTS "${col}"`,
      );
    }
  }
}
