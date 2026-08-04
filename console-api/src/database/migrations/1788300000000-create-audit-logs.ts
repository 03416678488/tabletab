import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditLogs1788300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'actorId', type: 'uuid', isNullable: true },
          { name: 'actorEmail', type: 'varchar', isNullable: true },
          { name: 'action', type: 'varchar' },
          { name: 'targetType', type: 'varchar', isNullable: true },
          { name: 'targetId', type: 'varchar', isNullable: true },
          { name: 'summary', type: 'varchar', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'ip', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({ name: 'IDX_audit_logs_action', columnNames: ['action'] }),
    );
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({ name: 'IDX_audit_logs_targetId', columnNames: ['targetId'] }),
    );
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({ name: 'IDX_audit_logs_createdAt', columnNames: ['createdAt'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs', true, true, true);
  }
}
