import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

const MANAGED_ROLES = [
  'Administrators',
  'Delivery Boys',
  'Customers',
  'Employees',
  'Waiters',
  'Chefs',
];

export class CreateRolePermissions1787000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed the fixed, managed roles (idempotent — roles.name is unique).
    for (const name of MANAGED_ROLES) {
      await queryRunner.query(
        `INSERT INTO "roles" ("name", "createdAt", "updatedAt")
         VALUES ($1, now(), now())
         ON CONFLICT ("name") DO NOTHING`,
        [name],
      );
    }

    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'roleId', type: 'int' },
          { name: 'resource', type: 'varchar' },
          { name: 'actions', type: 'json', default: `'[]'` },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_role_permissions_role_resource"
       ON "role_permissions" ("roleId", "resource")`,
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['roleId'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('role_permissions', true);
    // Leave seeded roles in place — other data may reference them.
  }
}
