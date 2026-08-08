import { MigrationInterface, QueryRunner } from 'typeorm';

/** Per-branch dine-in (QR) payment timing: `pay_after` (default, current flow)
 *  or `pay_first` (prepay online before the order reaches the kitchen). */
export class AddBranchDineInPaymentMode1790100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "dineInPaymentMode" varchar NOT NULL DEFAULT 'pay_after'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" DROP COLUMN IF EXISTS "dineInPaymentMode"`,
    );
  }
}
