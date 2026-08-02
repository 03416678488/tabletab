import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAreasAndLinkTables1786600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'areas',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Swap the free-text `area` column on tables for an `areaId` relation.
    await queryRunner.query(`ALTER TABLE "tables" DROP COLUMN IF EXISTS "area"`);
    await queryRunner.query(
      `ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS "areaId" uuid`,
    );
    await queryRunner.createForeignKey(
      'tables',
      new TableForeignKey({
        columnNames: ['areaId'],
        referencedTableName: 'areas',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tables" DROP COLUMN IF EXISTS "areaId"`);
    await queryRunner.query(
      `ALTER TABLE "tables" ADD COLUMN IF NOT EXISTS "area" varchar`,
    );
    await queryRunner.dropTable('areas', true);
  }
}
