import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Extend qr_codes to support two kinds of code:
 *  - 'table'  — auto-generated, one per table (encodes /t/{slug}) [existing rows]
 *  - 'custom' — user-defined (encodes an arbitrary URL / WiFi / review / text)
 *
 * `tableId` becomes nullable (custom codes have no table); its unique index
 * still holds because Postgres treats NULLs as distinct.
 */
export class QrCodeCustomKind1791400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "qr_codes"
        ADD COLUMN IF NOT EXISTS "kind" varchar NOT NULL DEFAULT 'table',
        ADD COLUMN IF NOT EXISTS "label" varchar,
        ADD COLUMN IF NOT EXISTS "customType" varchar,
        ADD COLUMN IF NOT EXISTS "content" text
    `);
    // Existing rows are all table codes.
    await queryRunner.query(
      `UPDATE "qr_codes" SET "kind" = 'table' WHERE "kind" IS NULL`,
    );
    // Custom codes carry no table — relax the NOT NULL.
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ALTER COLUMN "tableId" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop custom codes before restoring NOT NULL on tableId.
    await queryRunner.query(`DELETE FROM "qr_codes" WHERE "kind" = 'custom'`);
    await queryRunner.query(
      `ALTER TABLE "qr_codes" ALTER COLUMN "tableId" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "qr_codes"
        DROP COLUMN IF EXISTS "content",
        DROP COLUMN IF EXISTS "customType",
        DROP COLUMN IF EXISTS "label",
        DROP COLUMN IF EXISTS "kind"
    `);
  }
}
