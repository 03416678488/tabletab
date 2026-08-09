import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEvents1790200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" varchar NOT NULL,
        "description" varchar,
        "imageUrl" varchar,
        "basePrice" numeric(10,2),
        "sortOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_event_types" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_event_types_name" ON "event_types" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "eventTypeId" uuid,
        "branchId" uuid,
        "title" varchar NOT NULL,
        "date" varchar NOT NULL,
        "startTime" varchar NOT NULL,
        "endTime" varchar,
        "guestCount" integer NOT NULL DEFAULT 1,
        "guestName" varchar NOT NULL,
        "guestPhone" varchar NOT NULL,
        "guestEmail" varchar,
        "budget" numeric(10,2),
        "specialRequests" varchar,
        "status" varchar NOT NULL DEFAULT 'requested',
        "source" varchar NOT NULL DEFAULT 'online',
        "confirmedAt" TIMESTAMP WITH TIME ZONE,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_events_event_type" FOREIGN KEY ("eventTypeId")
          REFERENCES "event_types"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_events_branch" FOREIGN KEY ("branchId")
          REFERENCES "branches"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_branch_date" ON "events" ("branchId", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_types"`);
  }
}
