import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFilesTable1753616241576 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'files',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'fileName', type: 'varchar', isNullable: true },
          { name: 'originalFileName', type: 'varchar', isNullable: true },
          { name: 'mimetype', type: 'varchar', isNullable: true },
          { name: 'path', type: 'text', isNullable: true },
          { name: 'size', type: 'int', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('files', true);
  }
}
