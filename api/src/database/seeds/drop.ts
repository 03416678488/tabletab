import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Drop the entire database schema — every table, including the migrations
 * table — leaving an empty `public` schema. Use before a fresh
 * `db:migrate` + `db:seed` to reset dev data. DESTRUCTIVE: all data is lost.
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'tabletap-postgres',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USER || 'tabletap_user',
  password: process.env.POSTGRES_PASSWORD || 'secret',
  database: process.env.POSTGRES_DATABASE || 'tabletap_db',
  synchronize: false,
});

async function drop() {
  let isConnected = false;

  try {
    console.log('🔌 Connecting to database...');
    console.log(
      `   Database: ${process.env.POSTGRES_DATABASE || 'tabletap_db'}`,
    );

    await AppDataSource.initialize();
    isConnected = true;

    console.log('🗑️  Dropping schema "public"...');
    await AppDataSource.query('DROP SCHEMA public CASCADE');
    await AppDataSource.query('CREATE SCHEMA public');

    console.log('✅ Database dropped. Run db:migrate + db:seed to rebuild.');
  } catch (error) {
    console.error('❌ Drop failed:', (error as Error).message || error);
    process.exitCode = 1;
  } finally {
    if (isConnected) await AppDataSource.destroy();
    process.exit(process.exitCode ?? 0);
  }
}

drop();
