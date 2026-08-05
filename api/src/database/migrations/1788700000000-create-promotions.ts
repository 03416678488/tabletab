import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePromotions1788700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── promotions ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promotions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "description" text,
        "imageUrl" varchar,
        "discountType" varchar NOT NULL DEFAULT 'percentage',
        "discountValue" double precision NOT NULL DEFAULT 0,
        "code" varchar,
        "minOrderAmount" double precision NOT NULL DEFAULT 0,
        "maxDiscountAmount" double precision,
        "startsAt" TIMESTAMP WITH TIME ZONE,
        "endsAt" TIMESTAMP WITH TIME ZONE,
        "active" boolean NOT NULL DEFAULT true,
        "usageLimit" integer,
        "usageCount" integer NOT NULL DEFAULT 0,
        "perCustomerLimit" integer,
        "ctaHref" varchar,
        CONSTRAINT "PK_promotions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_promotions_slug" ON "promotions" ("slug")`,
    );
    // Codes are unique only when present (guest promos may have no code).
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_promotions_code" ON "promotions" ("code") WHERE "code" IS NOT NULL`,
    );

    // ── promotion_redemptions ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promotion_redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "redeemedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "promotionId" uuid NOT NULL,
        "customerId" uuid,
        "orderId" uuid,
        "code" varchar,
        "discountAmount" double precision NOT NULL DEFAULT 0,
        CONSTRAINT "PK_promotion_redemptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_promo_redemptions_promotion" FOREIGN KEY ("promotionId")
          REFERENCES "promotions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_promo_redemptions_promo_customer" ON "promotion_redemptions" ("promotionId", "customerId")`,
    );

    // ── orders: record which promotion was applied ────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promotionId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promotionCode" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "promotionCode"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "promotionId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promotion_redemptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promotions"`);
  }
}
