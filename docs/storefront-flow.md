# TableTap — Storefront ordering flow (customer)

**Status:** Implemented — real backend end-to-end (customer accounts, live menu/branches, real orders, live tracking).
**Not mock:** the storefront order journey no longer uses `@/lib/api`; it talks to the NestJS API.
**Companion:** live order-status updates are documented in [`realtime.md`](./realtime.md).

The customer journey: **discover → sign in → browse menu → cart → checkout → place order → track (live)**. This describes how each step maps onto real API endpoints and where the code lives.

---

## 1. Flow at a glance

```
 signup/signin ──▶ /order (browse) ──▶ cart ──▶ /checkout ──▶ POST /orders ──▶ /track/:id ──▶ SSE live status
   customer-auth      real catalog     useCart   real branch    (public)         public GET      /orders/:id/stream
```

| Step | Route | Data source |
|---|---|---|
| Sign up / sign in | `/signup`, `/signin` | `POST /customer-auth/register` \| `/login` |
| Account | `/account` | `GET/PUT /customer-auth/me` |
| Browse menu | `/order`, `/order/[branchId]` | `GET /menu-items`, `/categories`, `/branches` (public) |
| Cart | client-only | `useCart` (Zustand, persisted) |
| Checkout | `/checkout` | reads cart + session; formats address |
| Place order | — | `POST /orders` (public) |
| Track | `/track/[orderId]` | `GET /orders/:id` (public) + SSE stream |

---

## 2. Customer accounts (separate from staff)

Storefront customers are **not** staff `User`s. They're rows in the existing `customers` table, extended with a password for self-service login.

**Backend** (`api/src/modules/customer/`):

- `customer.entity.ts` — added `password varchar` with **`select: false`** (never returned by default). Migration `1788200000000-add-customer-password.ts` also adds a case-insensitive unique index on `email`.
- `customer-auth.controller.ts` / `customer-auth.service.ts` — all `@Public()` (the global staff JWT guard doesn't apply); the token they issue is verified in-service:
  - `POST /customer-auth/register` → `{ customer, token }`
  - `POST /customer-auth/login` → `{ customer, token }` (bcrypt compare, password fetched via `addSelect`)
  - `GET /customer-auth/me` / `PUT /customer-auth/me` (bearer token)
- The token is a **JWT signed with the same `JWT_SECRET`** but with a distinct payload `type: 'customer'`. It is verified only by `verifyCustomerId()` here — it is **not** accepted by the staff `JwtStrategy`.

**Frontend:**

- `features/storefront/services/customer-auth.ts` — plain `fetch` to `/customer-auth/*` (NOT `httpClient`, which attaches the *staff* NextAuth token). Unwraps the `{ _metaData, data }` envelope.
- `hooks/use-customer-session.ts` — Zustand store (persist key `tabletap-customer`, `version: 2`) holding `{ user, token, isAuthenticated }`. Exposes `login/signup/logout/refreshAccount/updateProfile`.

**Addresses are client-side.** The backend customer has a single free-text `address`; the storefront keeps a local address book in the session store purely for convenience. The actual delivery address is sent on the order as text (see checkout).

---

## 3. Browsing (real catalog)

The order pages read the same real data the storefront home does:

- `features/storefront/services/storefront-catalog.ts` — `fetchStorefrontProducts()` (`GET /menu-items`), `fetchStorefrontCategories()` (`GET /categories`).
- `features/storefront/services/storefront-branches.ts` — `fetchStorefrontBranches()` (`GET /branches`).
- Consumers: `app/(storefront)/order/page.tsx` (all dishes + filters) and `app/(storefront)/order/[branchId]/page.tsx` (branch menu). Both endpoints are `@Public()`.

Because the cart carries **real `menuItemId`s**, order line-items reference real menu items (the `order_items.menuItemId` FK resolves), keeping the storefront consistent with the dashboard.

Live menu changes (86'ing / repricing) push over SSE — see `realtime.md` (`useMenuStream`).

---

## 4. Cart

`hooks/use-cart.ts` — Zustand store (persist key `tabletap-cart`). Holds `branchId`, `fulfillmentType`, `items`, and derives `subtotal/tax/totalWithFees`. Switching branches clears the cart. Purely client-side; nothing hits the API until checkout.

---

## 5. Checkout → place a real order

`app/(storefront)/checkout/page.tsx` gathers fulfillment type (delivery/pickup), delivery address (or pickup time), shows the summary, and requires a signed-in customer (else prompts `/signin?returnUrl=/checkout`).

On pay it calls `placeStorefrontOrder()` (`features/storefront/services/storefront-orders.ts`), which `POST`s `/orders`:

```jsonc
{
  "orderType": "online",
  "branchId": "…",
  "customerId": "…",              // the signed-in customer
  "customerName": "…",
  "customerPhone": "…",
  "customerAddress": "12 Mall Rd, Lahore",  // delivery: address as one line; pickup: omitted
  "notes": "Pickup at 6:30 PM",   // pickup slot recorded in notes
  "tax": 2.5,
  "deliveryFee": 25,
  "items": [{ "menuItemId": "…", "name": "…", "unitPrice": 26, "quantity": 2 }]
}
```

**The server is the source of truth for money.** `OrderHelperService.resolveCreatePayload` computes `subtotal` from the line items, `total = subtotal + tax + deliveryFee − discount`, generates the `ORD-XXXXXX` number, sets `status: 'placed'`, and returns the full order (with `branch`, `customer`, `items`). The client never dictates totals.

`deliveryFee` is a first-class order column (entity + DTO + migration `1788300000000-add-order-delivery-fee`).

On success the cart is cleared and the app routes to `/track/{order.id}`.

---

## 6. Tracking (real order + live status)

`app/(storefront)/track/[orderId]/page.tsx`:

1. **Reconcile:** `fetchStorefrontOrder(id)` → `GET /orders/:id` (public) for the current state.
2. **Live deltas:** `useOrderStream(id, onStatus, isLive)` subscribes to `GET /orders/:id/stream` (SSE). Each `order.updated` frame updates the status pill + timeline **without a reload**.
3. **Safety-net poll:** while the order is live, refetch every 30s (catches anything missed and item/total edits).
4. **Terminal stop:** stream + poll stop once `completed`/`cancelled`.

The page shows a **"Live"** indicator driven by the stream's `connected` flag; if SSE can't connect, the poll alone keeps it correct — realtime is an enhancement, never a hard dependency. Full realtime details in [`realtime.md`](./realtime.md).

### Status vocabulary

Backend `OrderStatus` maps to the storefront's vocabulary in one place (`STATUS_MAP` in `storefront-orders.ts`), e.g. `confirmed → accepted`. Delivery vs pickup is inferred from whether `customerAddress` is present.

---

## 7. Security model

- **Order create + single-order read + the SSE stream are `@Public()`** — a storefront customer (guest or signed-in) can place and track an order. The order **UUID is an unguessable capability**: knowing it is what grants tracking, consistent for `GET /orders/:id` and the stream.
- **Everything else on `/orders` stays staff-guarded** — `GET /orders` (list), `board`, `board/stream`, `table-stats`, `by-table`, `PUT`, `DELETE`. Opening create/read did not open the rest.
- **Customer auth is its own JWT** (`type: 'customer'`), verified only by the customer-auth service; it is never accepted as a staff token.
- **Passwords** are bcrypt-hashed and `select: false`.
- The API is always the authorization boundary; the client caches/stores (Zustand) are UX only.

---

## 8. File map

**Backend**
- `modules/customer/customer-auth.{controller,service}.ts`, `entities/customer.entity.ts`, `dto/customer-{register,login,update-profile}.dto.ts`
- `modules/order/order.controller.ts` (`@Public()` create + `:id` + `:id/stream`), `order.service.ts` (emits realtime), `services/order.helper.service.ts` (totals + `deliveryFee`)
- migrations `1788200000000-add-customer-password`, `1788300000000-add-order-delivery-fee`

**Frontend**
- `features/storefront/services/customer-auth.ts`, `storefront-catalog.ts`, `storefront-branches.ts`, `storefront-orders.ts`
- `hooks/use-customer-session.ts`, `hooks/use-cart.ts`, `hooks/use-order-stream.ts`
- `app/(storefront)/{signup,signin,account,order,order/[branchId],checkout,track/[orderId]}/page.tsx`

---

## 9. Follow-ups

- **React Query** for storefront server-state (tenant-scoped keys, clear-on-logout, no sensitive persistence, SSE→cache integration) — deliberately deferred to a clean second pass so it isn't conflated with this wiring.
- Saved delivery addresses are currently client-local; a real `customer_addresses` table + endpoints would make them portable across devices.
