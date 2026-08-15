import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-sitting dine-in sessions. A table's QR slug is permanent; ordering on the
 * live bill is gated by a session token that rotates each sitting and is
 * invalidated when the table is settled (or after inactivity), so a previous
 * customer's saved link can't reach the next customer's order.
 */
export class CreateTableSessions1791100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "table_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tableId" uuid NOT NULL,
        "branchId" uuid,
        "token" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'open',
        "openedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "closedAt" TIMESTAMP WITH TIME ZONE,
        "lastOrderAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_table_sessions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_table_sessions_token" ON "table_sessions" ("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_table_sessions_table_status" ON "table_sessions" ("tableId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "table_sessions"`);
  }
}
