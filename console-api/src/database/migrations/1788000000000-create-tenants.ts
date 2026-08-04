import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTenants1788000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar' },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'status', type: 'varchar', default: `'provisioning'` },
          { name: 'plan', type: 'varchar', default: `'trial'` },
          { name: 'subdomain', type: 'varchar', isUnique: true },
          { name: 'storefrontDomain', type: 'varchar', isNullable: true },
          { name: 'adminDomain', type: 'varchar', isNullable: true },
          { name: 'dbName', type: 'varchar', isUnique: true },
          { name: 'dbHost', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenants', true);
  }
}
