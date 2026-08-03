# TableTap — White‑Label Multi‑Tenant Architecture

**Status:** Planning / feasibility — *no code yet*
**Model:** Centralized multi‑tenant API · database‑per‑tenant · domain‑mapped frontends

This document captures the plan for turning TableTap into a white‑label subscription
product where each restaurant is a **tenant** with its own database, reached through its
own domain, while all code and infrastructure stay on servers you own.

---

## 1. The model in one paragraph

You host everything — the API, the frontend, and every database. Each restaurant gets a
**private database** (strong isolation, no shared rows). Customers reach their site through
their **own domain**: the **storefront on the apex** (`acme.com`) and the **admin on a
subdomain** (`restaurant.acme.com`). Both hostnames map to the same tenant. You never ship
or share any code — a customer receives a web address and a DNS instruction, nothing to
install.

```
acme.com  ─────────────►  YOUR servers  ─────────►  Acme's database
restaurant.acme.com ────►  (API + frontend)          (private, isolated)
```

---

## 2. Why database‑per‑tenant fits *this* codebase

TableTap is **single‑tenant today**: there is no tenant/organization entity, and no
`tenantId` on any table — the top of the hierarchy is `branches`, and data scopes by
`branchId` at most.

- **Shared‑DB model** would require retrofitting `tenantId` onto all ~30 tables, backfilling
  data, and adding a tenant filter to *every* query — invasive and leak‑prone.
- **Database‑per‑tenant** puts isolation at the **connection layer**, so the existing 30
  tables and every existing query stay **exactly as they are**. Minimal change to the app
  you already built.

The cost doesn't vanish — it moves from "touch every query" to "manage many databases."
For an existing single‑tenant app, that trade is favorable.

---

## 3. Architecture at a glance

| Layer | What it is | Where it runs |
|---|---|---|
| **Control plane** | Registry: `hostname → tenant → { db credentials, plan, status }` | Your server |
| **Edge / proxy** | Terminates TLS (per‑hostname certs), forwards preserving `Host` | Your server |
| **Frontend** | One Next.js app; serves both storefront and admin, branded per tenant | Your server |
| **API** | One NestJS service; resolves tenant, connects to that tenant's DB | Your server |
| **Tenant databases** | One private Postgres DB per restaurant | Your server(s) |

Everything is a **service you operate** — no artifact ever leaves your infrastructure.

---

## 4. Hostname routing — storefront apex + admin subdomain

Both hostnames belong to the **same tenant**; the registry records what each is *for*:

```
acme.com             → tenant: Acme   ·  surface: storefront
restaurant.acme.com  → tenant: Acme   ·  surface: admin
```

The frontend already splits these as route groups: `(storefront)` and `(dashboard)`.
Routing is done in one piece of Next.js middleware:

```ts
// middleware.ts (sketch)
export function middleware(req) {
  const host = req.headers.get("host");            // acme.com | restaurant.acme.com
  const { tenantId, surface } = resolveHost(host); // cached registry lookup

  const res = NextResponse.next();
  res.headers.set("x-tenant-id", tenantId);        // downstream knows the DB

  const path = req.nextUrl.pathname;

  if (surface === "admin") {
    if (path === "/") return NextResponse.rewrite(new URL("/admin", req.url));
    return res;                                     // /admin, /manager, /login…
  }

  // storefront host: keep the dashboard unreachable here
  if (/^\/(admin|manager|chef|waiter)\b/.test(path)) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }
  return res;                                       // storefront routes
}
```

**DNS the customer sets once:**

| Surface | Host | Record |
|---|---|---|
| Storefront (apex) | `acme.com` | **A record → your IP** (apex can't CNAME; ALIAS/ANAME also works) |
| Admin (subdomain) | `restaurant.acme.com` | **CNAME → your host** |

Putting admin on its own hostname is a small **security win**: the admin session cookie is
scoped to `restaurant.acme.com` only, so nothing is shared with the public storefront.

> **Repos:** you need **two** codebases, not three — one frontend (both surfaces,
> hostname‑gated) and one API. A separate admin app is optional (only for a smaller public
> attack surface), and the middleware host‑gate above already gives most of that benefit.

---

## 5. Tenant isolation & security

- **Public storefront reads** resolve the tenant from the **Host** header (read‑only, fine).
- **Authenticated requests** take the tenant from the **JWT claim** — each token is issued
  *for one tenant* at login. The `Host` header is spoofable; the token is not. This ensures
  a token minted for Acme can never touch Bella's database.
- **CORS** allowlist is **dynamic** — built from the registered customer domains, since the
  frontend (customer domain) and API (your domain) are cross‑origin. Bearer tokens (already
  how `httpClient` works) sidestep cross‑site cookie issues.
- **Database‑per‑tenant** means isolation is physical: one restaurant literally cannot read
  another's data.

---

## 6. Provisioning a new tenant (one‑time, automated)

```
Sign up
  → create tenant row (control plane)
  → CREATE DATABASE
  → run migrations
  → seed (roles, admin user, settings, default website page)
  → register hostname(s) + issue TLS
  → activate
```

Reuse the existing seeders for the seed step. **Give every tenant a working
`*.yoursaas.com` subdomain immediately** so they're live before touching DNS — the custom
domain becomes an optional upgrade, not a blocker.

---

## 7. Scaling path — you don't have to pick one model forever

A shared database is **not** inherently slow; large SaaS run billions of rows on shared DBs.
Slowness comes from missing tenant‑leading indexes, giant un‑partitioned tables, and the
**noisy‑neighbor** effect — all made *worse* by big tenants. So enterprises are the *worst*
fit for a shared pool (most data, most traffic, strictest compliance).

The end state most SaaS land on is **hybrid**:

| Tenant type | Where it lives | Why |
|---|---|---|
| Small / long‑tail | **Shared DB** (pooled, `tenant_id`) | Cheap, easy ops at high count |
| **Enterprise / large** | **Dedicated DB** (today's model) | Isolation, no noisy neighbor, compliance, predictable performance |

Your current database‑per‑tenant setup **is** the enterprise‑grade lane. A shared pool would
only be added later to make *small* tenants cheaper — you keep big accounts dedicated. If
shared tables ever get large: **partition by `tenant_id`**, index tenant‑first, add read
replicas, and ultimately **shard** across many DBs (so it's never truly "one DB").

---

## 8. Developer experience — push tenancy to the edges

The guiding principle: resolve the tenant once, then let developers work as if the system
were single‑tenant.

- **`*.localhost` for local routing (zero config).** Browsers resolve `acme.localhost` to
  `127.0.0.1` automatically. Local mirrors prod: `acme.localhost:3000` (storefront),
  `acme.admin.localhost:3000` (admin).
- **Invisible tenant context.** Inject the tenant's DB connection request‑scoped so feature
  developers write **normal repository code** and never think about tenancy. Only the
  resolution layer knows tenants exist.
- **`DEV_TENANT` fast path.** Pin one tenant (`DEV_TENANT=acme`) to run against a single DB —
  essentially how the app works today — for everyday feature work.
- **One‑command tooling:**
  ```
  npm run tenant:create acme     # create DB → migrate → seed → default site
  npm run tenant:migrate:all     # apply pending migrations to every tenant DB
  ```
- **Seeded demo tenants in Docker Compose.** `docker compose up` boots 2–3 sample
  restaurants with data. Control‑plane DB + all dev tenant DBs live in one local Postgres
  container.

---

## 9. Customer experience — hide the machinery

- **Instant subdomain** on signup (`acme.yoursaas.com`) — live before any DNS.
- **Pre‑built starter storefront** using the existing website builder, so day one looks real.
- **Guided custom‑domain flow**: show the exact DNS records, auto‑verify, auto‑issue TLS,
  with a *Pending → Verified → Live* status. The `*.yoursaas.com` fallback always works.
- **Never expose "tenant" or "database."** Customers see their restaurant, site, and domain.
- **Impersonation** ("view as this restaurant") is the single most useful support tool to
  build for yourself.

---

## 10. The two ongoing costs (eyes open)

1. **Many databases to update** — every release must run migrations across all tenant DBs.
   Solved by the `tenant:migrate:all` runner + drift detection, but it's a permanent
   operational discipline.
2. **A ceiling per server** — connection‑pool limits cap you to low‑hundreds of tenants per
   Postgres cluster. Mitigate with lazy‑connect + idle eviction + PgBouncer; grow by adding
   clusters (shards).

---

## 11. Phased roadmap

| Phase | Goal | User‑visible? |
|---|---|---|
| **0. Control plane** | Tenant registry DB + platform auth (you log in separately) | No |
| **1. Dynamic routing** | Per‑tenant connection manager; make today's DB "tenant #1" | No |
| **2. Provisioning** | Create DB → migrate → seed → activate; suspend/delete | Platform only |
| **3. Hostname resolution** | Middleware: apex→storefront, subdomain→admin; JWT carries tenant | Yes |
| **4. Migration runner** | One command migrates all tenant DBs; drift check | No |
| **5. Subscriptions** | Plans + Stripe + per‑plan feature gating | Yes |
| **6. Ops & white‑label** | Per‑DB backups, monitoring, PgBouncer, custom domains + SSL | Yes |

**Recommended first move:** a throwaway **de‑risking spike** — control‑plane DB + 2 tenant
DBs, prove a request routes to the correct DB with provable isolation, and run the migration
loop across both. If that's clean, the rest is execution.

---

## 12. Open decisions to lock before Phase 1

1. **Identity:** tenant users in their tenant DB (purest isolation; login must resolve tenant
   first) vs. in the control plane (simpler login, weaker isolation).
2. **Addressing:** subdomain first, or custom domains from day one?
3. **Credentials:** where per‑tenant DB creds live (encrypted in control plane vs. secrets
   manager).
4. **Cluster strategy:** one Postgres cluster vs. per‑tier clusters (sets the scaling ceiling).
5. **Provisioning trigger:** self‑serve signup vs. you create tenants manually at first.
6. **Support access:** impersonation into tenant DBs — how it's gated and audited.

---

## Appendix — current codebase starting point

| Area | Today |
|---|---|
| Tenancy | Single‑tenant; **no** tenant entity, **no** `tenantId`; data scopes by `branchId` |
| Backend | NestJS + TypeORM + Postgres (Docker); ~30 migrations; global `JwtAuthGuard` + `RolesGuard` |
| Super‑admin | `isSuperAdmin` already derived from roles in the JWT strategy (per‑restaurant, not platform) |
| Frontend | Next.js App Router; `(storefront)` + `(dashboard)` route groups; `useTenant` is a **mock** |
| White‑label surface | Branding + website builder already built (per‑tenant look is largely done) |

**Feasibility verdict:** feasible on the current stack, and a good fit for a retrofit —
with two eyes‑open costs: connection‑pool scaling (tenants‑per‑cluster ceiling) and permanent
migration orchestration.
