import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceRequestAssignee1790000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "assignedUserId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_requests" DROP COLUMN IF EXISTS "assignedUserId"`,
    );
  }
}
