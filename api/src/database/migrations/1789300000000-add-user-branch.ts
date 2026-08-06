import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Home branch for a staff user — enables branch-scoped notification targeting.
 * NULL means the user is not scoped to a branch (sees all branches' events);
 * cross-branch roles (Owner, Multi Branch Manager) ignore this regardless.
 */
export class AddUserBranch1789300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "branchId"`);
  }
}
