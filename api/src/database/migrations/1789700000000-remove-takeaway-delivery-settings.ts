import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove the Take-away / Delivery order settings that were dropped from the
 * Order Setup screen. These were only ever created when an owner saved the form
 * (never seeded), so this just deletes the now-orphaned rows. Irreversible by
 * design — there's no meaningful value to restore.
 */
export class RemoveTakeawayDeliverySettings1789700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "settings"
       WHERE "group" = 'order'
         AND "key" IN (
           'takeaway',
           'delivery',
           'free_delivery_km',
           'basic_delivery_charge',
           'charge_per_kilo'
         )`,
    );
  }

  public async down(): Promise<void> {
    // No-op: the removed settings held no restorable data.
  }
}
