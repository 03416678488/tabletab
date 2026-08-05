import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderCustomerCoords1788500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerLat" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerLng" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "customerLat"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "customerLng"`);
  }
}
