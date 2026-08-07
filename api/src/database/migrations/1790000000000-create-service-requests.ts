import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/** Guest service-request queue (call waiter / ready to pay) for the staff boards. */
export class CreateServiceRequests1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'service_requests',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'type', type: 'varchar' },
          { name: 'status', type: 'varchar', default: "'open'" },
          { name: 'tableId', type: 'uuid', isNullable: true },
          { name: 'tableName', type: 'varchar', isNullable: true },
          { name: 'branchId', type: 'uuid', isNullable: true },
          { name: 'resolvedAt', type: 'timestamptz', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP', isNullable: true },
        ],
      }),
      true,
    );

    // Fast lookup of the open queue.
    await queryRunner.createIndex(
      'service_requests',
      new TableIndex({ name: 'IDX_service_requests_status', columnNames: ['status'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('service_requests', true);
  }
}
