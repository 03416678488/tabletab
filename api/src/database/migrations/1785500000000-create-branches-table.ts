import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBranchesTable1785500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'branches',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'address', type: 'varchar' },
          { name: 'city', type: 'varchar' },
          { name: 'phone', type: 'varchar' },
          { name: 'imageUrl', type: 'varchar', isNullable: true },
          { name: 'isOpen', type: 'boolean', default: true },
          { name: 'lat', type: 'double precision', isNullable: true },
          { name: 'lng', type: 'double precision', isNullable: true },
          { name: 'openingHours', type: 'varchar', isNullable: true },
          { name: 'deliveryFee', type: 'double precision', isNullable: true },
          { name: 'minOrder', type: 'double precision', isNullable: true },
          { name: 'onlineOrderingEnabled', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('branches', true);
  }
}
