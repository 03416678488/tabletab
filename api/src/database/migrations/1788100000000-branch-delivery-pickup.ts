import { MigrationInterface, QueryRunner } from 'typeorm';

export class BranchDeliveryPickup1788100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "deliveryEnabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "pickupEnabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "deliveryEtaMinutes" int`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN IF EXISTS "deliveryEtaMinutes"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN IF EXISTS "pickupEnabled"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN IF EXISTS "deliveryEnabled"`);
  }
}
