import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReservations1788300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "branchId" uuid,
        "tableId" uuid,
        "partySize" integer NOT NULL DEFAULT 2,
        "date" varchar NOT NULL,
        "time" varchar NOT NULL,
        "durationMins" integer NOT NULL DEFAULT 90,
        "guestName" varchar NOT NULL,
        "guestPhone" varchar NOT NULL,
        "guestEmail" varchar,
        "specialRequests" varchar,
        "status" varchar NOT NULL DEFAULT 'requested',
        "source" varchar NOT NULL DEFAULT 'online',
        "confirmedAt" TIMESTAMP WITH TIME ZONE,
        "seatedAt" TIMESTAMP WITH TIME ZONE,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_reservations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reservations_branch" FOREIGN KEY ("branchId")
          REFERENCES "branches"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_reservations_table" FOREIGN KEY ("tableId")
          REFERENCES "tables"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reservations_branch_date" ON "reservations" ("branchId", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reservations"`);
  }
}
