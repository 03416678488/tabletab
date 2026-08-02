import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTablesTable1786500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tables',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar' },
          { name: 'area', type: 'varchar', isNullable: true },
          { name: 'capacity', type: 'int', default: 2 },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'branchId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
        indices: [{ columnNames: ['branchId', 'name'], isUnique: true }],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'tables',
      new TableForeignKey({
        columnNames: ['branchId'],
        referencedTableName: 'branches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tables', true);
  }
}
