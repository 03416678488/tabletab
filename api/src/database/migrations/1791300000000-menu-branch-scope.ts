import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-branch catalog — each branch owns its own menu. Adds an owning `branchId`
 * to categories, food types, menus and menu items so the admin (and storefront)
 * can scope the catalog to a branch; "All branches" shows everything.
 *
 * Existing (pre-branch) catalog rows keep a null branchId — they surface only
 * under "All branches" until assigned to a branch (backfill separately).
 */
export class MenuBranchScope1791300000000 implements MigrationInterface {
  private readonly tables = ['categories', 'food_types', 'menus', 'menu_items'];

  /** Name was globally unique; per-branch catalogs need it unique per branch. */
  private readonly nameUniqueTables = ['categories', 'food_types', 'menus'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const t of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_${t}_branchId" ON "${t}" ("branchId")`,
      );
    }

    // Relax global unique(name) → unique(branchId, name) so each branch can have
    // its own "Drinks" category / "Lunch" menu / "Spicy" food type. The old
    // uniqueness is a table CONSTRAINT (drop via ALTER TABLE, not DROP INDEX);
    // also clear any stray plain unique index on (name).
    for (const t of this.nameUniqueTables) {
      await queryRunner.query(`
        DO $$
        DECLARE nm text;
        BEGIN
          -- Drop single-column unique CONSTRAINTS on (name).
          FOR nm IN
            SELECT con.conname
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_attribute att
              ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
            WHERE rel.relname = '${t}' AND con.contype = 'u'
            GROUP BY con.conname
            HAVING array_agg(att.attname::text ORDER BY att.attnum) = ARRAY['name']
          LOOP
            EXECUTE 'ALTER TABLE "${t}" DROP CONSTRAINT IF EXISTS ' || quote_ident(nm);
          END LOOP;
          -- Drop any remaining plain unique INDEX on (name).
          FOR nm IN
            SELECT indexname FROM pg_indexes
            WHERE tablename = '${t}'
              AND indexdef ILIKE '%unique%'
              AND indexdef ILIKE '%(name)%'
          LOOP EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(nm); END LOOP;
        END $$;
      `);
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_${t}_branch_name" ON "${t}" ("branchId", "name")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const t of this.nameUniqueTables) {
      await queryRunner.query(`DROP INDEX IF EXISTS "UQ_${t}_branch_name"`);
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_${t}_name" ON "${t}" ("name")`,
      );
    }
    for (const t of this.tables) {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${t}_branchId"`);
      await queryRunner.query(
        `ALTER TABLE "${t}" DROP COLUMN IF EXISTS "branchId"`,
      );
    }
  }
}
