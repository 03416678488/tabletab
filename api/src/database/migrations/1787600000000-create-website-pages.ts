import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateWebsitePages1787600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'website_pages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'title', type: 'varchar' },
          {
            name: 'content',
            type: 'jsonb',
            default: `'{"blocks":[],"header":{},"footer":{}}'`,
          },
          { name: 'published', type: 'jsonb', isNullable: true },
          { name: 'publishedAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    // Seed the single landing page the builder edits first.
    await queryRunner.query(
      `INSERT INTO website_pages (slug, title) VALUES ('home', 'Home')
       ON CONFLICT (slug) DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('website_pages', true);
  }
}
