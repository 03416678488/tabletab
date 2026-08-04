/**
 * Tenant migration orchestrator.
 *
 * Runs the restaurant-schema migrations across EVERY tenant database plus the
 * provisioning template, so a schema change ships to all tenants (and new
 * clones inherit it). Reads the tenant list from the control-plane registry.
 *
 *   node src/cor/scripts/migrate-tenants.js            # migrate template + all tenants
 *   SHOW=1 node src/cor/scripts/migrate-tenants.js     # dry run: show pending per DB
 *   SKIP_BUILD=1 node ...                              # reuse existing dist (don't rebuild)
 *   INCLUDE_DEFAULT=1 node ...                         # also migrate the default DB
 *
 * Env: POSTGRES_HOST/PORT/USER/PASSWORD, CONTROL_PLANE_DB (default tabletap_console),
 *      TENANT_TEMPLATE_DB (default tabletap_template).
 */
const { execSync } = require('child_process');
const { Client } = require('pg');

const CONTROL_DB = process.env.CONTROL_PLANE_DB || 'tabletap_console';
const TEMPLATE_DB = process.env.TENANT_TEMPLATE_DB || 'tabletap_template';
const SHOW = !!process.env.SHOW;
const command = SHOW ? 'migration:show' : 'migration:run';

async function tenantDatabases() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: CONTROL_DB,
  });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT "dbName", slug, status FROM tenants ORDER BY "createdAt"`,
    );
    return rows;
  } finally {
    await client.end();
  }
}

function runFor(database) {
  execSync(`npm run typeorm -- ${command} -d src/config/migration.config.ts`, {
    stdio: 'inherit',
    env: { ...process.env, POSTGRES_DATABASE: database },
  });
}

async function main() {
  if (!process.env.SKIP_BUILD) {
    console.log('🏗️  Building…');
    execSync('npm run build', { stdio: 'inherit' });
  }

  const tenants = await tenantDatabases();
  const targets = [
    { dbName: TEMPLATE_DB, slug: '(template)', status: 'active' },
    ...(process.env.INCLUDE_DEFAULT
      ? [{ dbName: process.env.POSTGRES_DATABASE || 'tabletap_db', slug: '(default)', status: 'active' }]
      : []),
    ...tenants,
  ];

  console.log(`\n📋 ${command} across ${targets.length} database(s)\n`);
  const results = [];
  for (const t of targets) {
    console.log(`\n──────── ${t.dbName} (${t.slug}, ${t.status}) ────────`);
    try {
      runFor(t.dbName);
      results.push({ database: t.dbName, tenant: t.slug, result: 'ok' });
    } catch (err) {
      results.push({ database: t.dbName, tenant: t.slug, result: 'FAILED' });
    }
  }

  console.log('\n════════ Summary ════════');
  console.table(results);
  const failed = results.filter((r) => r.result === 'FAILED');
  if (failed.length) {
    console.error(`❌ ${failed.length} database(s) failed.`);
    process.exit(1);
  }
  console.log('✅ All databases up to date.');
}

main().catch((err) => {
  console.error('❌ Orchestrator error:', err);
  process.exit(1);
});
