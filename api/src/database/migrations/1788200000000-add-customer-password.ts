import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerPassword1788200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "password" varchar`,
    );
    // Storefront accounts log in by email — make it unique when present.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_customers_email" ON "customers" (LOWER("email")) WHERE "email" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_customers_email"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "password"`);
  }
}
