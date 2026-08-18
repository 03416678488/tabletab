/**
 * Role-based authorization matrix test.
 *
 * Logs in as each seeded role and asserts the expected HTTP status on gated
 * endpoints. Reads (GET) assert both allow (200) and deny (403). Writes assert
 * DENY only (403 fires in the guard, before the handler — so nothing mutates);
 * the allowed-write cases are skipped so the test stays side-effect free.
 *
 * Run inside the API container (it binds on 127.0.0.1):
 *   docker exec tabletap-api node scripts/authz-test.mjs
 */
const BASE = process.env.API_BASE || 'http://127.0.0.1:3003/api';
const PASS = 'Passw0rd@123';

const ROLES = {
  Owner: { email: 'owner@example.com', password: 'Owner@123' },
  'Multi Branch Manager': { email: 'multibranch@example.com', password: PASS },
  'Branch Manager': { email: 'branchmanager@example.com', password: PASS },
  Waiter: { email: 'waiter@example.com', password: PASS },
  Chef: { email: 'chef@example.com', password: PASS },
  'Delivery Rider': { email: 'delivery@example.com', password: PASS },
  // Customer accounts cannot authenticate to the staff API at all (login 401) —
  // a good property, so they're excluded from the staff authorization matrix.
};

const ALL = Object.keys(ROLES);
const MGRS = ['Owner', 'Multi Branch Manager', 'Branch Manager'];

// GET endpoints: list the roles that SHOULD get 200; everyone else must get 403.
const READS = [
  { path: '/reports/sales', module: 'reports', allow: MGRS },
  { path: '/transactions', module: 'reports', allow: MGRS },
  { path: '/user/list', module: 'users', allow: MGRS },
  { path: '/orders', module: 'orders', allow: [...MGRS, 'Waiter', 'Chef', 'Delivery Rider'] },
  { path: '/tables', module: 'tables', allow: [...MGRS, 'Waiter'] },
  { path: '/areas', module: 'areas', allow: MGRS },
  { path: '/qr-codes', module: 'qr-codes', allow: MGRS },
  { path: '/customers', module: 'customers', allow: [...MGRS, 'Waiter'] },
  { path: '/reservations', module: 'reservations', allow: [...MGRS, 'Waiter'] },
  { path: '/events', module: 'events', allow: MGRS },
  { path: '/promotions', module: 'promotions', allow: MGRS },
  { path: '/campaigns', module: 'campaigns', allow: MGRS },
  { path: '/dashboard/analytics', module: 'dashboard', allow: [...MGRS, 'Waiter', 'Chef', 'Delivery Rider'] },
  { path: '/role-permissions/matrix', module: 'settings', allow: ['Owner'] },
  { path: '/role-permissions/me', module: '(ungated)', allow: ALL }, // self — everyone
];

// WRITE deny-tests: assert 403 for roles that LACK the grant (no mutation happens).
const WRITE_DENIES = [
  { method: 'PUT', path: '/settings/company', module: 'settings', deny: ALL.filter((r) => r !== 'Owner') },
  { method: 'POST', path: '/branches', module: 'branches', deny: ['Waiter', 'Chef', 'Delivery Rider', 'Customer'] },
  { method: 'POST', path: '/taxes', module: 'vat', deny: ['Waiter', 'Chef', 'Delivery Rider', 'Customer'] },
];

async function login(role) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(ROLES[role]),
  });
  if (!r.ok) throw new Error(`login ${role} failed: ${r.status}`);
  const j = await r.json();
  const token = j?.data?.tokens?.token || j?.data?.accessToken || j.accessToken;
  if (!token) throw new Error(`no accessToken for ${role}: ${JSON.stringify(j).slice(0, 120)}`);
  return token;
}

async function call(token, method, path) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: method === 'GET' ? undefined : '{}',
  });
  return r.status;
}

let pass = 0, fail = 0;
const fails = [];
function check(role, label, got, okExpected) {
  // okExpected=true → expect access (2xx); false → expect 403.
  const ok = okExpected ? got >= 200 && got < 300 : got === 403;
  if (ok) pass++; else { fail++; fails.push(`${role} ${label} → ${got} (expected ${okExpected ? '2xx' : '403'})`); }
}

const tokens = {};
for (const role of ALL) {
  try { tokens[role] = await login(role); }
  catch (e) { console.log('LOGIN ERROR', role, e.message); }
}

for (const role of ALL) {
  const t = tokens[role];
  if (!t) continue;
  for (const rd of READS) {
    const got = await call(t, 'GET', rd.path);
    check(role, `GET ${rd.path}`, got, rd.allow.includes(role));
  }
  for (const wd of WRITE_DENIES) {
    if (!wd.deny.includes(role)) continue; // only assert the deny cases (no mutation)
    const got = await call(t, wd.method, wd.path);
    check(role, `${wd.method} ${wd.path}`, got, false);
  }
}

console.log(`\n=== Authorization matrix: ${pass} passed, ${fail} failed ===`);
if (fails.length) { console.log('FAILURES:'); for (const f of fails) console.log('  ✗ ' + f); process.exit(1); }
else console.log('All authorization checks passed ✅');
