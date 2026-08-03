# TableTap — Setting up a new tenant

**Status:** Implemented — reflects the shipped control plane (`console-api` / `console-client`).
**Model:** Centralized multi‑tenant API · database‑per‑tenant · domain‑mapped frontends

This guide walks through creating a new restaurant (**tenant**) on the platform — from the
first record to a live, TLS‑secured custom domain. There are two paths:

- **Self‑serve** — the customer signs themselves up (one API call / one page).
- **Console (platform admin)** — you create the tenant on their behalf.

Both end in the same place: a provisioned per‑tenant database, a first admin user, and an
instantly reachable subdomain. See [white-label-architecture.md](./white-label-architecture.md)
for the why behind the design.

---

## 0. Prerequisites

- The shared stack is running: **Postgres**, **Redis**, the **restaurant API** (`tabletap-api`,
  port `3003`), and the **console API** (`tabletap-console-api`, port `3005`).
- A **template database** (`tabletap_template`) exists — a pre‑migrated + seeded restaurant
  schema. New tenant DBs are cloned from it (`CREATE DATABASE … TEMPLATE`), so they start
  ready‑to‑use. Set `TENANT_TEMPLATE_DB` in `console-api/.env.development`.

Bring the console API up (the restaurant stack must already be running — it owns the shared
network + Postgres/Redis):

```bash
cd console-api
./cli/docker.sh dev-up
```

A **platform admin** account is seeded for the console (control plane):

| Field | Value |
| --- | --- |
| Email | `admin@tabletap.io` |
| Password | `Admin@12345` |

Get a token for the API examples below:

```bash
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tabletap.io","password":"Admin@12345"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['tokens']['token'])")
```

---

## 1. Create the tenant

### Path A — Self‑serve signup (public, no auth)

The customer provisions their own workspace and becomes its first admin in one call:

```bash
curl -s -X POST http://localhost:3005/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantName": "Pixel Diner",
    "handle": "pixel-diner",
    "email": "owner@pixeldiner.com",
    "password": "OwnerPass@123",
    "plan": "starter"
  }'
```

Response includes the tenant, the **instant subdomain**, and the live URLs:

```json
{
  "tenant": { "slug": "pixel-diner", "status": "active", "dbName": "tenant_pixel_diner", ... },
  "subdomain": "pixel-diner",
  "storefrontUrl": "https://pixel-diner.yourapp.com",
  "adminUrl": "https://pixel-diner.yourapp.com/admin",
  "owner": { "email": "owner@pixeldiner.com" }
}
```

In the browser, the same flow lives at **`/signup`** on the console‑client.

What happens under the hood:

1. The tenant is registered in the control plane and its database is **cloned from the
   template** (create → migrate → seed, instantly).
2. The owner is inserted into the **new tenant database** and granted the **Admin** role.
3. If any step fails, the whole thing **rolls back** — the database is dropped and the
   registry row removed, so a half‑made tenant never lingers.

Guards: the `handle` must be unique, lowercase‑kebab, ≥ 3 chars, and not a reserved word
(`admin`, `api`, `www`, …); the password must be ≥ 8 chars.

### Path B — Console (platform admin creates it)

In the console‑client, go to **Tenants → New tenant**, enter the name, handle, plan, and the
**first admin** (owner email + a temporary password). Or via API:

```bash
curl -s -X POST http://localhost:3005/api/tenants \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "name": "Pixel Diner",
    "slug": "pixel-diner",
    "plan": "starter",
    "adminEmail": "owner@pixeldiner.com",
    "adminPassword": "OwnerPass@123"
  }'
```

`create` provisions the database immediately and — when `adminEmail` + `adminPassword` are
supplied — seeds the first admin into the tenant DB (same mechanism as self‑serve). Hand the
temporary password to the owner so they can sign in and change it. If provisioning didn't
finish (tenant stays `provisioning`), retry from the tenant row (**Provision** action) or:

```bash
curl -s -X POST http://localhost:3005/api/tenants/<TENANT_ID>/provision \
  -H "Authorization: Bearer $TOKEN"
```

> The owner credentials are **optional** on the API (omit them to create a bare tenant), but
> the console's **New tenant** dialog requires them, so every console‑created tenant gets an
> admin login. Owner seeding is atomic — a failure leaves no partial user behind.

---

## 2. Verify it's live (instant subdomain)

A tenant is reachable at `‹handle›.‹PLATFORM_APP_DOMAIN›` the moment it's `active` — host →
tenant resolution falls back to the subdomain label, so no extra config is needed.

Locally you can prove per‑tenant routing with a `*.localhost` host header against the
restaurant API:

```bash
# Resolves to the pixel-diner database specifically
curl -s -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" -H "x-tenant-host: pixel-diner.localhost" \
  -d '{"email":"owner@pixeldiner.com","password":"OwnerPass@123"}'
```

The owner logs in and receives the **Admin** role + a tenant‑bound token.

---

## 3. Map the customer's own domain (optional)

Custom hostnames become routable only **after DNS ownership is verified**. Manage them on the
tenant detail page (**Tenants → ‹tenant› → Custom domains**) or via API.

**Add** a domain (kind = `storefront` or `admin`):

```bash
curl -s -X POST http://localhost:3005/api/tenants/<TENANT_ID>/domains \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"hostname": "pixeldiner.com", "kind": "storefront"}'
```

The response includes the exact **DNS TXT record** to publish:

```json
"dns": {
  "recordType": "TXT",
  "name": "_tabletap-challenge.pixeldiner.com",
  "value": "tabletap-verify=‹token›"
}
```

The customer adds that TXT record at their DNS provider. Then **verify**:

```bash
curl -s -X POST http://localhost:3005/api/domains/<DOMAIN_ID>/verify \
  -H "Authorization: Bearer $TOKEN"
```

On success the hostname is copied onto the tenant (`storefrontDomain` / `adminDomain`) and
starts routing. Until verified it stays `pending`/`failed` and never routes — so a domain the
customer doesn't actually control can't hijack traffic.

---

## 4. Automatic HTTPS for the domain

The [edge proxy](../console-api/edge/README.md) (Caddy) issues a TLS certificate for each
tenant hostname **on demand**, gated by the control plane so certs are only ever minted for
hostnames we actually serve:

```bash
cd console-api
cp edge/.env.edge.example edge/.env.edge   # set ACME_EMAIL, upstreams
docker compose -f edge/docker-compose.edge.yml --env-file edge/.env.edge up -d
```

Point DNS (the verified custom domain, and/or a `*.PLATFORM_APP_DOMAIN` wildcard) at the edge
host's public IP. Caddy fetches the certificate the first time each name is requested.

---

## 5. Subscription & billing (optional)

Set the plan at creation, change it later on the tenant detail page, or start a Stripe
checkout:

```bash
curl -s -X POST http://localhost:3005/api/billing/checkout \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tenantId": "<TENANT_ID>", "plan": "starter"}'
```

Stripe webhooks keep `subscriptionStatus` / `currentPeriodEnd` in sync; the plan drives
feature‑gating and limits (branches, staff, orders).

---

## 6. Lifecycle & operations

| Action | Where |
| --- | --- |
| Suspend / reactivate | Tenant detail page, or `PUT /tenants/:id/status` |
| Change plan / edit | Tenant detail page, or `PUT /tenants/:id` |
| Run migrations across all tenant DBs | `npm run db:migrate:tenants` (restaurant API) |
| View who did what | Console **Activity** log, or `GET /audit-logs` |

**Delete** a tenant — irreversible, drops the database. Requires confirming with the tenant's
own handle:

```bash
curl -s -X DELETE "http://localhost:3005/api/tenants/<TENANT_ID>?confirm=<handle>" \
  -H "Authorization: Bearer $TOKEN"
```

Every mutating action here (create, provision, status, plan, delete, domain add/verify/remove)
is written to the **audit log** with the acting admin, the target, and a timestamp.

---

## Quick reference — endpoints

| Purpose | Method + path | Auth |
| --- | --- | --- |
| Self‑serve signup | `POST /api/signup` | public |
| Create tenant | `POST /api/tenants` | platform admin |
| Provision / retry | `POST /api/tenants/:id/provision` | platform admin |
| Update / status | `PUT /api/tenants/:id` · `/:id/status` | platform admin |
| Delete (+ drop DB) | `DELETE /api/tenants/:id?confirm=‹handle›` | platform admin |
| Add / list domains | `POST` · `GET /api/tenants/:id/domains` | platform admin |
| Verify / remove domain | `POST /api/domains/:id/verify` · `DELETE /api/domains/:id` | platform admin |
| TLS authorization (edge) | `GET /api/edge/authorize-tls?domain=` | public (proxy) |
| Billing checkout | `POST /api/billing/checkout` | platform admin |
| Audit log | `GET /api/audit-logs` | platform admin |

*All console‑API routes are under the `:3005/api` prefix; tenant‑facing app/data routes are on
the restaurant API at `:3003/api`, resolved to the right tenant by `Host` / `x-tenant-*`.*
