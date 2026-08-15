import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Make VAT per-branch: add `branchId` to taxes + tax_groups, and replace the
 * global unique(code) on taxes with a composite unique(branchId, code) so each
 * branch keeps its own VAT list.
 */
export class TaxBranchScope1791800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['taxes', 'tax_groups']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
      );
      await queryRunner.query(`
        ALTER TABLE "${table}"
          ADD CONSTRAINT "FK_${table}_branch"
          FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL
      `);
    }

    // Drop the old global unique constraint/index on taxes(code) alone.
    await queryRunner.query(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
          WHERE rel.relname = 'taxes' AND con.contype = 'u'
          GROUP BY con.conname
          HAVING array_agg(att.attname::text ORDER BY att.attnum) = ARRAY['code']
        LOOP
          EXECUTE format('ALTER TABLE "taxes" DROP CONSTRAINT %I', r.conname);
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
          WHERE c.relname = 'taxes' AND i.indisunique AND i.indnatts = 1
            AND (SELECT attname FROM pg_attribute WHERE attrelid = c.oid AND attnum = i.indkey[0]) = 'code'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %s', r.idx);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_taxes_branch_code"
        ON "taxes" ("branchId", "code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_taxes_branch_code"`);
    await queryRunner.query(
      `ALTER TABLE "taxes" ADD CONSTRAINT "UQ_taxes_code" UNIQUE ("code")`,
    );
    for (const table of ['taxes', 'tax_groups']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "FK_${table}_branch"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "branchId"`,
      );
    }
  }
}
