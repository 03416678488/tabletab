import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateKioskAnalyticsTimeslots1787300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'kiosk_machines',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'machineId', type: 'varchar', isUnique: true },
          { name: 'userName', type: 'varchar', isNullable: true },
          { name: 'username', type: 'varchar' },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'branchId', type: 'uuid', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'kiosk_machines',
      new TableForeignKey({
        columnNames: ['branchId'],
        referencedTableName: 'branches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'analytics',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'code', type: 'text', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'time_slots',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'day', type: 'varchar' },
          { name: 'startTime', type: 'varchar' },
          { name: 'endTime', type: 'varchar' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('time_slots', true);
    await queryRunner.dropTable('analytics', true);
    await queryRunner.dropTable('kiosk_machines', true);
  }
}
