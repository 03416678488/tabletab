import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddMediaFolderParent1787900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_folders" ADD COLUMN IF NOT EXISTS "parentId" uuid`,
    );

    // Self-referencing FK: deleting a parent folder cascades to its subfolders
    // (images inside deleted folders fall back to root via files.folderId SET NULL).
    await queryRunner.createForeignKey(
      'media_folders',
      new TableForeignKey({
        columnNames: ['parentId'],
        referencedTableName: 'media_folders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('media_folders');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('parentId'));
    if (fk) await queryRunner.dropForeignKey('media_folders', fk);
    await queryRunner.query(`ALTER TABLE "media_folders" DROP COLUMN IF EXISTS "parentId"`);
  }
}
