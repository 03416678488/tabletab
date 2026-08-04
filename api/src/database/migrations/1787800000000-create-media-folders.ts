import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMediaFolders1787800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'media_folders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar' },
          { name: 'userId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "folderId" uuid`,
    );

    await queryRunner.createForeignKey(
      'files',
      new TableForeignKey({
        columnNames: ['folderId'],
        referencedTableName: 'media_folders',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('files');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('folderId'));
    if (fk) await queryRunner.dropForeignKey('files', fk);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN IF EXISTS "folderId"`);
    await queryRunner.dropTable('media_folders', true);
  }
}
