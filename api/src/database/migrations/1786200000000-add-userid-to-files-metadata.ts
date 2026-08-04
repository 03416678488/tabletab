import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToFilesMetadata1786200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "files_metadata" ADD COLUMN IF NOT EXISTS "userId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "files_metadata" DROP COLUMN IF EXISTS "userId"`,
    );
  }
}
