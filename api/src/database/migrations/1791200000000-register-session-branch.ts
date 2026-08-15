import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-branch cash registers — a drawer is a physical, single-branch object, so
 * each register session now belongs to a branch. Existing (pre-branch) sessions
 * keep a null branchId. Lets the register be scoped to the selected branch and
 * an "All branches" overview to roll up every drawer.
 */
export class RegisterSessionBranch1791200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "register_sessions" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_register_sessions_branch_status" ON "register_sessions" ("branchId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_register_sessions_branch_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "register_sessions" DROP COLUMN IF EXISTS "branchId"`,
    );
  }
}
