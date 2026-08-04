import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFileMetadataTable1753616256562 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'files_metadata',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'fileId', type: 'uuid', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'isDeleted', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'files_metadata',
      new TableForeignKey({
        columnNames: ['fileId'],
        referencedTableName: 'files',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_file',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
   await queryRunner.dropTable('files_metadata', true);
  }
}
