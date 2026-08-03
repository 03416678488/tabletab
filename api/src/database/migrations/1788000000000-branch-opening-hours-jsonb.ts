import { MigrationInterface, QueryRunner } from 'typeorm';

export class BranchOpeningHoursJsonb1788000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Move from free-text hours to a structured weekly object. Existing (free-
    // text placeholder) values are reset to null, meaning "inherit global".
    await queryRunner.query(
      `ALTER TABLE "branches" ALTER COLUMN "openingHours" TYPE jsonb USING NULL::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "branches" ALTER COLUMN "openingHours" TYPE varchar USING NULL::varchar`,
    );
  }
}
