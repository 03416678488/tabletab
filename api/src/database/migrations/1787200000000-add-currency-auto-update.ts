import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyAutoUpdate1787200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "autoUpdate" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "currencies" DROP COLUMN IF EXISTS "autoUpdate"`);
  }
}
