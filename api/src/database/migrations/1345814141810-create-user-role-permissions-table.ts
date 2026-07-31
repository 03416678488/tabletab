import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserRolePermissionsTable1345857816938 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_role_permissions',
        columns: [
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'roleId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'permissionId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'user_role_permissions',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
    );

    await queryRunner.createForeignKey(
      'user_role_permissions',
      new TableForeignKey({
        columnNames: ['roleId'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
      }),
    );

    await queryRunner.createForeignKey(
      'user_role_permissions',
      new TableForeignKey({
        columnNames: ['permissionId'],
        referencedTableName: 'permissions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_role_permissions');
  }
}
