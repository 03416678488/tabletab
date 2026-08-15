import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Give custom QR codes their own `branchId` so they scope to the branch they
 * were created under (table codes keep deriving their branch from the table).
 */
export class QrCodeBranchScope1791600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "qr_codes"
        ADD COLUMN IF NOT EXISTS "branchId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "qr_codes"
        ADD CONSTRAINT "FK_qr_codes_branch"
        FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "qr_codes" DROP CONSTRAINT IF EXISTS "FK_qr_codes_branch"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_codes" DROP COLUMN IF EXISTS "branchId"`,
    );
  }
}
