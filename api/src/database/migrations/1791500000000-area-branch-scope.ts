import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Make areas per-branch: add `branchId` and replace the global unique(name)
 * with a composite unique(branchId, name), so each branch can name its own
 * areas independently (mirrors the per-branch menu catalog).
 */
export class AreaBranchScope1791500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "areas"
        ADD COLUMN IF NOT EXISTS "branchId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "areas"
        ADD CONSTRAINT "FK_areas_branch"
        FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL
    `);

    // Drop the old global unique constraint(s) on (name) alone, whatever it was
    // auto-named. It may be a UNIQUE CONSTRAINT or a UNIQUE INDEX.
    await queryRunner.query(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
          WHERE rel.relname = 'areas' AND con.contype = 'u'
          GROUP BY con.conname
          HAVING array_agg(att.attname::text ORDER BY att.attnum) = ARRAY['name']
        LOOP
          EXECUTE format('ALTER TABLE "areas" DROP CONSTRAINT %I', r.conname);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN
          SELECT indexrelid::regclass::text AS idx
          FROM pg_index i
          JOIN pg_class c ON c.oid = i.indrelid
          WHERE c.relname = 'areas' AND i.indisunique AND i.indnatts = 1
            AND (SELECT attname FROM pg_attribute WHERE attrelid = c.oid AND attnum = i.indkey[0]) = 'name'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %s', r.idx);
        END LOOP;
      END $$;
    `);

    // Composite unique(branchId, name).
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_areas_branch_name"
        ON "areas" ("branchId", "name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_areas_branch_name"`);
    await queryRunner.query(
      `ALTER TABLE "areas" DROP CONSTRAINT IF EXISTS "FK_areas_branch"`,
    );
    await queryRunner.query(
      `ALTER TABLE "areas" DROP COLUMN IF EXISTS "branchId"`,
    );
    await queryRunner.query(`
      ALTER TABLE "areas"
        ADD CONSTRAINT "UQ_areas_name" UNIQUE ("name")
    `);
  }
}
