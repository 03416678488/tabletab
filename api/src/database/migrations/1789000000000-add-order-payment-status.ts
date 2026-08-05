import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderPaymentStatus1789000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentStatus" varchar NOT NULL DEFAULT 'unpaid'`,
    );
    // Backfill: treat already-recorded payments (online checkout / POS pay-now)
    // as paid so existing orders aren't asked to pay again.
    await queryRunner.query(
      `UPDATE "orders" SET "paymentStatus" = 'paid'
       WHERE "orderType" = 'online' OR ("paymentMethod" IS NOT NULL AND "paymentMethod" <> '')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "paymentStatus"`);
  }
}
