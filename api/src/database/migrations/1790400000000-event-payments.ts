import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Event payment earnings — the agreed amount staff collect against an event
 * booking (advance / package). Recording a payment also posts an `event_payment`
 * transaction, which is what reports/dashboard aggregate.
 */
export class EventPayments1790400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "paymentAmount" double precision NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "paymentMethod" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "paymentCollectedAt" timestamptz`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of [
      'paymentAmount',
      'paymentMethod',
      'paymentCollectedAt',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "events" DROP COLUMN IF EXISTS "${col}"`,
      );
    }
  }
}
