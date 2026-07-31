import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCodeAttemptLogsTable1772100935015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'code_attempt_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'codeType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'enteredCode',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'correctCode',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'isCorrect',
            type: 'boolean',
            default: false,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'code_attempt_logs',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(
      `CREATE INDEX IDX_code_attempt_logs_userId ON code_attempt_logs("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_code_attempt_logs_userId_codeType ON code_attempt_logs("userId", "codeType")`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_code_attempt_logs_createdAt ON code_attempt_logs("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('code_attempt_logs');
  }
}
