# Edge proxy — automatic TLS for tenant domains

Caddy sits in front of the platform and gives **every tenant hostname** — both
`*.PLATFORM_APP_DOMAIN` subdomains and customers' own custom domains — a valid
HTTPS certificate, issued **on demand** (per hostname, at first request) with no
per-domain config and no redeploys.

## How it works

```
                          ┌────────────────────────────────────────────┐
   client (HTTPS)         │                 Caddy edge                  │
  acme.com ─────────────► │  1. new SNI "acme.com"                      │
                          │  2. GET console-api /api/edge/authorize-tls │
                          │        ?domain=acme.com                     │
                          │       ├─ 200 → obtain cert (Let's Encrypt)  │
                          │       └─ 403 → refuse (no cert issued)      │
                          │  3. reverse_proxy, preserving Host          │
                          └───────────────┬──────────────┬─────────────┘
                                          │              │
                              /api/*  ────┘              └──── everything else
                                  ▼                              ▼
                          restaurant API (:3003)         Next.js web app (:3000)
                          (resolves tenant by Host)       (storefront / admin by Host)
```

The **authorization hook** (`GET /api/edge/authorize-tls?domain=<host>` on the
console-api) is the guardrail: Caddy issues a certificate only when it returns
`200`. The control plane returns `200` for

1. a custom domain that passed DNS verification (`tenant_domains.status = verified`),
2. a hostname already activated on a tenant (`storefrontDomain` / `adminDomain`), or
3. a live platform subdomain `<label>.<PLATFORM_APP_DOMAIN>` where `<label>` is a tenant,

and `403` for everything else — so a stranger pointing their domain at us can't
trigger unbounded ACME issuance (a real rate-limit / abuse risk).

Upstreams keep the original `Host` header, which is exactly what host→tenant
resolution needs.

## Run it

```bash
cd console-api
cp edge/.env.edge.example edge/.env.edge   # then edit ACME_EMAIL etc.
docker compose -f edge/docker-compose.edge.yml --env-file edge/.env.edge up -d
```

Requirements:

- Ports **80 + 443** reachable from the internet (ACME HTTP/TLS challenges).
- DNS for every tenant hostname points at this host's public IP:
  - `*.PLATFORM_APP_DOMAIN` → wildcard A/AAAA record;
  - each custom domain → A/AAAA (or the customer CNAMEs to your platform host).
- The `caddy_data` volume is **persisted** — it holds issued certs and the ACME
  account. Losing it re-triggers issuance and can hit Let's Encrypt rate limits.

## Verifying without public DNS (local)

The issuance step needs real DNS + reachable 80/443, so it can't run in a dev
sandbox. The **authorization gate**, however, is plain HTTP and fully testable:

```bash
# 200 for served hosts, 403 for anything else
curl -s -o /dev/null -w "%{http_code}\n" \
  "http://localhost:3005/api/edge/authorize-tls?domain=acme.com"          # 200
curl -s -o /dev/null -w "%{http_code}\n" \
  "http://localhost:3005/api/edge/authorize-tls?domain=evil-random.com"   # 403
```

## Notes

- **Traefik/nginx** instead of Caddy: point their on-demand-TLS / cert hook at the
  same `/api/edge/authorize-tls` endpoint. The contract is just "2xx = issue".
- Storefront-vs-admin selection is the **app's** job (it reads `Host`), so the
  proxy stays a thin, host-preserving pass-through.
