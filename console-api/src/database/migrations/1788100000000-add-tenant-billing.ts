import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTenantBilling1788100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('tenants', [
      new TableColumn({ name: 'stripeCustomerId', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'stripeSubscriptionId', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'subscriptionStatus', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'currentPeriodEnd', type: 'timestamp', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('tenants', [
      'stripeCustomerId',
      'stripeSubscriptionId',
      'subscriptionStatus',
      'currentPeriodEnd',
    ]);
  }
}
