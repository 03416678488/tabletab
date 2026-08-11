import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Branch attribution for earnings transactions that have no order link
 * (reservation deposits, event payments) — lets the dashboard filter ancillary
 * earnings per branch. Order-linked sales still derive their branch from the order.
 */
export class TransactionBranch1790500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_branchId" ON "transactions" ("branchId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_branchId"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "branchId"`,
    );
  }
}
