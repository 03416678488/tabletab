import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove the generic content-translation feature (the "Translations" button):
 * drop the `translations` table. The app's UI localization (locale routing,
 * language switcher) is unaffected — that's separate.
 */
export class DropTranslations1791700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "translations"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "translations" (
        "id" SERIAL PRIMARY KEY,
        "entity" varchar NOT NULL,
        "entityId" varchar NOT NULL,
        "field" varchar NOT NULL,
        "locale" varchar NOT NULL,
        "value" text
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_translations_unique"
        ON "translations" ("entity", "entityId", "field", "locale")
    `);
  }
}
