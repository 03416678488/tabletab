import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { DEFAULT_SETTINGS } from '@modules/setting/setting.constants';

const CURRENCIES = [
  { name: 'Dollars', symbol: '$', code: 'USD' },
  { name: 'Taka', symbol: '৳', code: 'BDT' },
  { name: 'Rupee', symbol: '₹', code: 'INR' },
  { name: 'Naira', symbol: '₦', code: 'NGN' },
  { name: 'Peso', symbol: '₱', code: 'ARS' },
];

const TAXES = [
  { name: 'No-VAT', code: 'VAT-0', rate: 0 },
  { name: 'VAT', code: 'VAT-5%', rate: 5 },
  { name: 'VAT', code: 'VAT-10%', rate: 10 },
  { name: 'GST', code: 'GST-5%', rate: 5 },
  { name: 'GST', code: 'GST-10%', rate: 10 },
];

const LANGUAGES = [
  { name: 'English', code: 'en', isDefault: true },
  { name: 'Bangla', code: 'bn', isDefault: false },
  { name: 'German', code: 'de', isDefault: false },
  { name: 'Arabic', code: 'ar', isDefault: false },
];

export class CreateSettingsAndI18n1787100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'settings',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'group', type: 'varchar' },
          { name: 'key', type: 'varchar' },
          { name: 'value', type: 'text', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_settings_group_key" ON "settings" ("group", "key")`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'currencies',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'symbol', type: 'varchar' },
          { name: 'code', type: 'varchar', isUnique: true },
          { name: 'exchangeRate', type: 'double precision', default: 1 },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'taxes',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'code', type: 'varchar', isUnique: true },
          { name: 'rate', type: 'double precision', default: 0 },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'languages',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'code', type: 'varchar', isUnique: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'isDefault', type: 'boolean', default: false },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'translations',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'entity', type: 'varchar' },
          { name: 'entityId', type: 'varchar' },
          { name: 'field', type: 'varchar' },
          { name: 'locale', type: 'varchar' },
          { name: 'value', type: 'text', isNullable: true },
        ],
      }),
      true,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_translations_unique" ON "translations" ("entity", "entityId", "field", "locale")`,
    );

    // Seed default settings (idempotent).
    for (const [group, values] of Object.entries(DEFAULT_SETTINGS)) {
      for (const [key, value] of Object.entries(values)) {
        await queryRunner.query(
          `INSERT INTO "settings" ("group", "key", "value") VALUES ($1, $2, $3)
           ON CONFLICT ("group", "key") DO NOTHING`,
          [group, key, value],
        );
      }
    }

    for (const c of CURRENCIES) {
      await queryRunner.query(
        `INSERT INTO "currencies" ("name", "symbol", "code") VALUES ($1, $2, $3)
         ON CONFLICT ("code") DO NOTHING`,
        [c.name, c.symbol, c.code],
      );
    }

    for (const t of TAXES) {
      await queryRunner.query(
        `INSERT INTO "taxes" ("name", "code", "rate") VALUES ($1, $2, $3)
         ON CONFLICT ("code") DO NOTHING`,
        [t.name, t.code, t.rate],
      );
    }

    for (const l of LANGUAGES) {
      await queryRunner.query(
        `INSERT INTO "languages" ("name", "code", "isDefault") VALUES ($1, $2, $3)
         ON CONFLICT ("code") DO NOTHING`,
        [l.name, l.code, l.isDefault],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('translations', true);
    await queryRunner.dropTable('languages', true);
    await queryRunner.dropTable('taxes', true);
    await queryRunner.dropTable('currencies', true);
    await queryRunner.dropTable('settings', true);
  }
}
