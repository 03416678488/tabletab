# TableTap — Realtime updates (SSE)

**Status:** Implemented — order-status streaming (storefront tracking), the staff kitchen/pickup board (KDS/OSS), live menu availability/pricing (storefront + POS), the live floor/tables view, **and** reservations (guest confirmation + manager book) are all live.
**Transport:** Server-Sent Events (SSE) over HTTP · single logical bus · Redis-ready seam
**Trust model:** capability-by-UUID for customer tracking · staff/tenant-scoped channels for the dashboard (planned)

This describes how live updates flow from the API to clients — starting with **order
status** (a customer watching their order go `placed → confirmed → preparing → ready →
…`), and how to extend it to the next channels (KDS/board, menu availability).

---

## 1. Why SSE (not WebSockets)

Almost everything we push is **server → client broadcast** (order status, menu
availability). Clients still *act* over normal REST (staff `PUT`s a status, a customer
`POST`s an order); the stream is just "something changed, here's the new state."

SSE fits that shape with the least moving parts:

- Plain HTTP — reuses our existing stack, CORS, and TLS. No protocol upgrade to be blocked
  by proxies.
- **Auto-reconnect is built in** (the browser's `EventSource` retries on drop).
- No sticky sessions or extra infra for a single instance.

If the POS later needs genuinely bidirectional features (acks, presence), add a Socket.IO
gateway for the **staff** side specifically — the channel/security model below is identical
either way.

---

## 2. Architecture

```
 Service layer (post-commit)         RealtimeService            SSE endpoint            Client
 ───────────────────────────         ───────────────           ────────────            ──────
 OrderService.updateOrder() ── publish("order:<id>", ──▶ RxJS Subject ──▶ GET /orders/:id/stream ──▶ EventSource
   (after DB commit)               "order.updated", {…})     .channel(name)   (filters to that channel)   onmessage
```

- **`RealtimeService`** (`api/src/modules/realtime/`) is the whole bus: an in-memory RxJS
  `Subject<RealtimeEvent>`. `publish(channel, type, data)` emits; `channel(name)` returns an
  Observable filtered to one channel. It's a `@Global()` module, so any service can inject it.
- **Events are emitted from the service layer, _after_ the DB commit** — never before, so a
  client never sees a state the database doesn't have. `OrderService.createOrder`/`updateOrder`
  emit `order.created`/`order.updated` (to `order:<id>`) **and** `board.changed` (to the
  tenant board), the latter only on create + status change.
- **Channel names** live in one place — `api/src/modules/realtime/channels.ts` — so emitters
  and SSE endpoints can't drift.
- **SSE endpoints** carry a 25s heartbeat: `GET /orders/:id/stream` (customer, public) and
  `GET /orders/board/stream` (staff, guarded).

### Channel naming

| Channel | Purpose | Auth |
|---|---|---|
| `order:<uuid>` | one customer tracking one order | capability (knowing the UUID) |
| `board:<tenantId>` | staff KDS/OSS — new + changed orders for the tenant | **staff JWT** (guarded route) |
| `menu:<tenantId>` | menu availability / price / add / remove | **public** per-tenant (menu isn't sensitive) |
| `branches:<tenantId>` | branch open / online-ordering / delivery / pickup / fees | **public** per-tenant (branches are public) |
| `tables:<tenantId>` | floor view — table CRUD + order-driven occupancy | **staff JWT** (guarded route) |
| `reservation:<uuid>` | one guest tracking their booking | capability (knowing the UUID) |
| `reservations:<tenantId>` | manager reservation book — new + changed bookings | **staff JWT** (guarded route) |

`order:<uuid>` needs no tenant prefix (the UUID is unique). `board:<tenantId>` and
`menu:<tenantId>` are scoped by the request's resolved tenant (`default` on the dev/tenant-less
DB), so one restaurant never wakes for another's changes.

The `menu:<tenantId>` stream (`GET /menu-items/stream`) is `@Public()`, so the storefront and
POS use **native `EventSource`** for it — no auth header needed. `MenuService` emits
`menu.changed` (payload `{id}`) on create/update/delete; consumers refetch to reconcile. The
storefront `/order` page and the POS terminal both subscribe, so 86'ing or repricing an item
reflects instantly in both.

Both SSE endpoints share one transform: `sseFromChannel(realtime, channel)` in
`realtime/sse.util.ts`.

### Authenticating an SSE stream (staff)

`EventSource` **cannot set an `Authorization` header**, which is fine for the capability-based
customer stream but not for the staff board. Two consequences:

- The board endpoint is a **normal guarded route** (not `@Public()`) — the global JWT guard
  authenticates it and the tenant middleware scopes it, reusing all existing auth. No token in
  the URL.
- The client reads it with **`fetch` + a stream reader** (`client/lib/event-stream.ts`),
  sending the bearer token from the NextAuth session. The token is refetched on every
  reconnect, so a rotated token is picked up automatically.

The board event is deliberately just `{event: "board.changed", orderId, status}` — the client
**refetches `GET /orders/board`** to reconcile (debounced 250ms to coalesce bursts). Simple and
always consistent; we can switch to merging deltas if board volume ever demands it.

### Payload shape

The SSE `data:` line is a single JSON object — parse once:

```json
{ "event": "order.updated", "at": "…ISO…", "id": "…", "orderNumber": "ORD-5255C3", "status": "ready", "updatedAt": "…ISO…" }
```

Payloads are **minimal and non-sensitive** on purpose (id + status, no customer PII). If a
client needs full detail it refetches over REST. `event: "ping"` frames are heartbeats and
are ignored by clients.

---

## 3. Security model

- **Order tracking is capability-by-UUID.** `GET /orders/:id` and `GET /orders/:id/stream`
  are both `@Public()` because the order UUID is an unguessable capability — the same trust
  decision, kept consistent. A guest who checked out can track via their link; a signed-in
  customer's token additionally proves ownership but isn't required. (This is also why SSE
  suits it: `EventSource` can't send an `Authorization` header anyway.)
- **Staff channels (planned) authenticate on subscribe**, and the endpoint must verify the
  **tenant claim in the staff JWT equals the channel's tenant** — that check is the wall that
  stops tenant A ever receiving tenant B's events.
- **Least-privilege payloads.** Broadcasting only `{id, status, updatedAt}` means even a
  mis-scoped channel leaks almost nothing.
- Origin allowlist + WSS/HTTPS in production (already configured via `enableCors`).
- The list/board/mutation order routes stay **staff-guarded**; only single-order read + the
  stream were opened.

---

## 4. Robustness / correctness

- **Reconcile on connect.** The stream is a *hint*, not the source of truth. The tracking
  page does an initial REST `GET /orders/:id`, then applies stream deltas on top. Anything
  missed during a reconnect self-heals.
- **Safety-net poll.** The page also refetches the full order every 30s while the order is
  live — catches missed events and picks up item/total changes. SSE gives the instant update;
  the poll is the belt-and-suspenders.
- **Heartbeat** every 25s prevents idle-timeout by proxies and surfaces dead connections.
- **Terminal stop.** Both the stream subscription and the poll stop once the order is
  `completed`/`cancelled`.
- **Graceful degradation.** If SSE can't connect, the poll alone keeps the page correct — the
  UI shows "Reconnecting…"; realtime is an enhancement, never a hard dependency.

---

## 5. Scaling seam (multi-instance)

Today the API is a single instance, so the in-memory Subject is enough. The moment we run 2+
replicas, an event `publish`ed on instance A won't reach a client connected to instance B.

**There is exactly one place to change:** `RealtimeService.publish()`. Also push the event to
**Redis pub/sub** (Redis is already in the stack — see `docs/tenant-setup.md`), and have a
Redis subscriber on every instance call `this.stream$.next(event)`. The channel model and
every consumer stay identical. Postgres `LISTEN/NOTIFY` is an alternative backplane.

---

## 6. Frontend usage

`useOrderStream(orderId, onUpdate, enabled)` (`client/hooks/use-order-stream.ts`) wraps
`EventSource`, parses frames, maps the backend status to the storefront vocabulary
(`confirmed → accepted`, etc. — shared with `storefront-orders.ts`), ignores `ping`, and
reports a `connected` flag for the "Live" indicator. The browser handles reconnection.

```ts
const { connected } = useOrderStream(orderId, ({ status }) =>
  setOrder((prev) => (prev ? { ...prev, status } : prev)),
  isLive, // stop once completed/cancelled
);
```

The tracking page (`app/(storefront)/track/[orderId]/page.tsx`) is the reference consumer.

**Staff board:** `useBoardStream(onChange)` (`features/order/hooks/use-board-stream.ts`) opens the
authenticated board stream via `openEventStream` and calls `onChange` on each `board.changed`.
`useOrderBoard` uses it to debounce-refetch `GET /orders/board`, keeping a 30s poll as a safety
net; `kds-board.tsx` shows the resulting "Live" badge. New storefront orders and staff status
changes both appear on the KDS without a manual refresh.

**Menu:** `useMenuStream(onChange)` (`client/hooks/use-menu-stream.ts`) wraps native
`EventSource` (public stream) and calls `onChange` on `menu.changed`. The storefront `/order`
page refetches products; the POS terminal calls its `refresh()`. 86'ing/repricing shows up
instantly in both.

**Tables/floor:** `useTablesStream(onChange)` (`features/table/hooks/use-tables-stream.ts`) —
authenticated (fetch-stream, like the board). `TableService` emits `tables.changed` on CRUD;
`OrderService` also emits it when an order touches a table (occupancy). `useTables` (table
manager) and `use-table-stats` (POS floor) both refetch on it.

---

## 7. Adding a new realtime channel

1. **Emit** from the owning service, after commit:
   `this._realtime.publish('t:'+tenantId+':menu', 'menu.item.updated', { id, isAvailable })`.
2. **Expose** an `@Sse` endpoint (or reuse a gateway) that subscribes to that channel. For
   staff/tenant channels, authenticate the subscriber and assert the tenant claim.
3. **Consume** on the client with an `EventSource`/hook that reconciles via REST first, then
   applies deltas guarded by `updatedAt`.

Keep payloads minimal; let clients refetch details.
