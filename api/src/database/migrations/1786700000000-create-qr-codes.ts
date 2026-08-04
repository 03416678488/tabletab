import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateQrCodes1786700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'qr_codes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'tableId', type: 'uuid', isUnique: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'qr_codes',
      new TableForeignKey({
        columnNames: ['tableId'],
        referencedTableName: 'tables',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('qr_codes', true);
  }
}
