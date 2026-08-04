import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateTenantDomains1788200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenant_domains',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'tenantId', type: 'uuid' },
          { name: 'hostname', type: 'varchar', isUnique: true },
          { name: 'kind', type: 'varchar' },
          { name: 'verificationToken', type: 'varchar' },
          { name: 'status', type: 'varchar', default: `'pending'` },
          { name: 'verifiedAt', type: 'timestamp', isNullable: true },
          { name: 'lastCheckedAt', type: 'timestamp', isNullable: true },
          { name: 'lastError', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'tenant_domains',
      new TableIndex({
        name: 'IDX_tenant_domains_tenantId',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createForeignKey(
      'tenant_domains',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenant_domains', true, true, true);
  }
}
