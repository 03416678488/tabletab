import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTaxGroups1787400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tax_groups',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'code', type: 'varchar', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'tax_group_taxes',
        columns: [
          { name: 'taxGroupId', type: 'int', isPrimary: true },
          { name: 'taxId', type: 'int', isPrimary: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'tax_group_taxes',
      new TableForeignKey({
        columnNames: ['taxGroupId'],
        referencedTableName: 'tax_groups',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'tax_group_taxes',
      new TableForeignKey({
        columnNames: ['taxId'],
        referencedTableName: 'taxes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tax_group_taxes', true);
    await queryRunner.dropTable('tax_groups', true);
  }
}
