import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { User } from '@modules/user/entities/users.entity';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { UserRolePermissions } from '@modules/role/entities/user-role-permissions.entity';
import { RolePermission } from '@modules/role-permission/entities/role-permission.entity';
import { CodeAttemptLog } from '@modules/user/entities/code-attempt-log.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Deterministically set a user's password.
 *
 *   npm run db:reset-password -- <email> <newPassword>
 *
 * This app is multi-tenant: each tenant lives in its OWN database, and login
 * authenticates against the tenant DB resolved from the request host. So a reset
 * in just the default DB won't help if you log into a tenant. This script resets
 * the password in EVERY database that contains the user — the default app DB and
 * every tenant DB listed in the control-plane registry — so login works wherever
 * the account lives.
 */
const HOST = process.env.POSTGRES_HOST || 'localhost';
const PORT = parseInt(process.env.POSTGRES_PORT ?? '5432', 10);
const USER = process.env.POSTGRES_USER || 'tabletap_user';
const PASS = process.env.POSTGRES_PASSWORD || 'secret';
const DEFAULT_DB = process.env.POSTGRES_DATABASE || 'tabletap_db';
const CONTROL_DB = process.env.CONTROL_PLANE_DB || 'tabletap_console';

const ENTITIES = [
  User,
  Role,
  Permission,
  UserRolePermissions,
  RolePermission,
  CodeAttemptLog,
  Branch,
];

interface Target {
  label: string;
  database: string;
  host: string;
}

/** Read the control-plane registry for every tenant DB (best-effort). */
async function tenantTargets(): Promise<Target[]> {
  const control = new DataSource({
    type: 'postgres',
    name: 'control',
    host: HOST,
    port: PORT,
    username: USER,
    password: PASS,
    database: CONTROL_DB,
  });
  try {
    await control.initialize();
    const rows = (await control.query(
      'SELECT slug, "dbName", "dbHost" FROM tenants',
    )) as { slug: string; dbName: string; dbHost: string | null }[];
    return rows.map((r) => ({
      label: `tenant:${r.slug}`,
      database: r.dbName,
      host: r.dbHost || HOST,
    }));
  } catch (err) {
    console.warn(
      `⚠️  Could not read tenant registry (${CONTROL_DB}): ${(err as Error).message}`,
    );
    console.warn('   Continuing with the default database only.');
    return [];
  } finally {
    if (control.isInitialized) await control.destroy();
  }
}

/** Reset the password for `email` in one database. Returns true if a user was updated. */
async function resetIn(
  target: Target,
  email: string,
  hash: string,
): Promise<boolean> {
  const ds = new DataSource({
    type: 'postgres',
    name: `reset_${target.database}`,
    host: target.host,
    port: PORT,
    username: USER,
    password: PASS,
    database: target.database,
    entities: ENTITIES,
    synchronize: false,
  });
  try {
    await ds.initialize();
    const repo = ds.getRepository(User);
    const user = await repo.findOne({ where: { email } });
    if (!user) {
      console.log(`  ⏭️  ${target.label} (${target.database}) — no such user`);
      return false;
    }
    user.password = hash;
    await repo.save(user);
    console.log(`  ✅ ${target.label} (${target.database}) — updated`);
    return true;
  } catch (err) {
    console.log(
      `  ⚠️  ${target.label} (${target.database}) — ${(err as Error).message}`,
    );
    return false;
  } finally {
    if (ds.isInitialized) await ds.destroy();
  }
}

async function run() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) {
    console.error(
      'Usage: npm run db:reset-password -- <email> <newPassword>\n' +
        'Example: npm run db:reset-password -- owner@example.com Owner@123',
    );
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);

  const targets: Target[] = [
    { label: 'default', database: DEFAULT_DB, host: HOST },
    ...(await tenantTargets()),
  ];

  console.log(
    `\nResetting password for ${email} across ${targets.length} database(s):`,
  );
  let updated = 0;
  for (const t of targets) {
    if (await resetIn(t, email, hash)) updated++;
  }

  console.log('');
  if (updated > 0) {
    console.log(
      `✅ Password set to "${newPassword}" in ${updated} database(s).`,
    );
  } else {
    console.log(
      `❌ No database contained a user with email ${email}. Nothing changed.`,
    );
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
