import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1078923871213 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'firstName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lastName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'avatarUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'resetToken',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'resetTokenExpiry',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resetCodeAttempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'resetCodeLastAttemptAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resetCodeLockedUntil',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resetCodeDeliveredVia',
            type: 'varchar',
            length: '50',
            isNullable: true,
            default: "'email'",
          },
          {
            name: 'resetCodeSentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'emailVerified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'verificationToken',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'verificationTokenExpiry',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verificationCodeAttempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'verificationCodeLastAttemptAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verificationCodeLockedUntil',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verificationCodeDeliveredVia',
            type: 'varchar',
            length: '50',
            isNullable: true,
            default: "'email'",
          },
          {
            name: 'verificationCodeSentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isDeleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'passwordChangedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: true,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
