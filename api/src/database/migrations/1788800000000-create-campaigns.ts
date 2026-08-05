import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaigns1788800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaigns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" varchar NOT NULL,
        "body" text NOT NULL DEFAULT '',
        "promotionId" uuid,
        "status" varchar NOT NULL DEFAULT 'draft',
        "scheduledAt" TIMESTAMP WITH TIME ZONE,
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "totalRecipients" integer NOT NULL DEFAULT 0,
        "sentCount" integer NOT NULL DEFAULT 0,
        "failedCount" integer NOT NULL DEFAULT 0,
        "simulated" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_campaigns" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaign_recipients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "campaignId" uuid NOT NULL,
        "customerId" uuid,
        "name" varchar,
        "phone" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "messageId" varchar,
        "error" varchar,
        "sentAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_campaign_recipients" PRIMARY KEY ("id"),
        CONSTRAINT "FK_campaign_recipients_campaign" FOREIGN KEY ("campaignId")
          REFERENCES "campaigns"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_campaign_recipients_campaign" ON "campaign_recipients" ("campaignId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "campaign_recipients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaigns"`);
  }
}
