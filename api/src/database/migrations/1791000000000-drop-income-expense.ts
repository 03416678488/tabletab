import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

/**
 * Remove the Income and Expense modules — drop their record + category tables.
 * `down` recreates them (mirrors 1787500000000-create-income-expense) so the
 * removal is reversible.
 */
export class DropIncomeExpense1791000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('expenses', true);
    await queryRunner.dropTable('expense_categories', true);
    await queryRunner.dropTable('incomes', true);
    await queryRunner.dropTable('income_categories', true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const kind of ['income', 'expense']) {
      const catTable = `${kind}_categories`;
      const recTable = kind === 'income' ? 'incomes' : 'expenses';
      const forCol = `${kind}For`;

      await queryRunner.createTable(
        new Table({
          name: catTable,
          columns: [
            { name: 'id', type: 'serial', isPrimary: true },
            { name: 'name', type: 'varchar', isUnique: true },
            { name: 'isActive', type: 'boolean', default: true },
          ],
        }),
        true,
      );

      await queryRunner.createTable(
        new Table({
          name: recTable,
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'gen_random_uuid()',
            },
            { name: 'amount', type: 'double precision', default: 0 },
            { name: 'categoryId', type: 'int', isNullable: true },
            { name: forCol, type: 'varchar', isNullable: true },
            { name: 'paymentType', type: 'varchar', isNullable: true },
            { name: 'referenceNumber', type: 'varchar', isNullable: true },
            { name: 'date', type: 'date', isNullable: true },
            { name: 'note', type: 'text', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        recTable,
        new TableForeignKey({
          columnNames: ['categoryId'],
          referencedTableName: catTable,
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }
}
