import { MigrationInterface, QueryRunner } from 'typeorm';

/** Order origin channel + provider order id — powers status sync-back to
 *  delivery aggregators (e.g. foodpanda). */
export class AddOrderSource1789500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source" varchar`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "externalRef" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "externalRef"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "source"`);
  }
}
