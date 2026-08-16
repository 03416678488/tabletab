"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, safeImageSrc } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { useMenuStream } from "@/hooks/use-menu-stream";
import { useDragScroll } from "@/hooks/use-drag-scroll";

import { Dropdown } from "@/components/ui/dropdown";
import { useQueryClient } from "@tanstack/react-query";
import { MENU_ITEMS_ALL_KEY, useAllMenuItems } from "@/features/menu/hooks/use-all-menu-items";
import { useCategories } from "@/features/category/hooks/use-categories";
import { useTables } from "@/features/table/hooks/use-tables";
import { useTaxes } from "@/features/tax/hooks/use-taxes";
import { useTaxGroups } from "@/features/tax/hooks/use-tax-groups";
import { useDefaultTax } from "@/features/tax/hooks/use-default-tax";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import { groupRate } from "@/features/tax/services/tax-group.service";
import { CustomerSelect } from "@/features/customer/components/customer-select";
import type { Customer } from "@/features/customer/types/customer.types";
import { orderService } from "@/features/order/services/order.service";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { useOfflineQueue } from "@/features/offline/hooks/use-offline-queue";
import { loadMenuSnapshot, saveMenuSnapshot } from "@/features/offline/lib/offline-store";
import { OfflineBar } from "@/features/offline/components/offline-bar";
import { QueuedOrdersDialog } from "@/features/offline/components/queued-orders-dialog";
import { transactionService } from "@/features/transaction/services/transaction.service";
import {
  ItemCustomizeDialog,
  type CustomizedLine,
} from "@/features/order/components/item-customize-dialog";
import { PaymentDialog, type PaymentResult } from "@/features/order/components/payment-dialog";
import { paymentMethodLabel } from "@/features/order/lib/payment-label";
import { printReceipt } from "@/features/order/lib/print-receipt";
import type { MenuItem } from "@/features/menu/types/menu.types";
import type { CreateOrderInput, Order, OrderType } from "@/features/order/types/order.types";
import { ORDER_STATUS_META, ORDER_TYPE_META } from "@/features/order/constants/order.constants";

type CartLine = CustomizedLine;

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "table", label: "Dine-In" },
  { value: "pos", label: "Takeaway" },
  { value: "online", label: "Delivery" },
];

const CART_STORAGE_KEY = "tabletap.pos.cart";

interface PersistedCart {
  cart: CartLine[];
  orderType: OrderType;
  tableId: string;
  discountKind: "percentage" | "amount";
  discountInput: string;
  taxId?: string;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function PosTerminal() {
  const settings = useSettings();
  const businessName = settings.get("company", "name");
  // Logo lives in the Theme settings group (Settings → Theme → Logo), the same
  // source as the business name — not the client branding store.
  const businessLogo = safeImageSrc(settings.get("theme", "logo"));
  // Every POS order belongs to a branch: multi-branch roles use the topbar
  // selection (POS is gated by <RequireBranch>); staff use their home branch.
  const orderBranchId = useScopedBranchId();
  // Categories + the item catalogue are scoped to this branch (items are global;
  // a branch "carries" an item via its per-branch categories).
  const { categories, loading: categoriesLoading } = useCategories(orderBranchId);
  const { taxes } = useTaxes();
  const { groups: taxGroups } = useTaxGroups();
  const { defaultTax } = useDefaultTax();

  const catDrag = useDragScroll<HTMLDivElement>();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);

  // Load the whole catalog once (cached), then filter client-side — instant
  // category/search with no per-click network round-trips.
  const { data: allItems = [], isLoading: loading } = useAllMenuItems();
  const queryClient = useQueryClient();
  const refresh = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: MENU_ITEMS_ALL_KEY }),
    [queryClient],
  );
  // Live menu updates — an 86'd/repriced item reflects on the POS instantly.
  useMenuStream(refresh);

  // Offline fallback: queue orders locally + serve the menu from a cached snapshot.
  const { online, queue, pending, failed, syncing, syncNow, enqueue, retry, discard } =
    useOfflineQueue();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [offlineMenu, setOfflineMenu] = useState<MenuItem[]>([]);
  useEffect(() => {
    void loadMenuSnapshot().then(setOfflineMenu);
  }, []);
  useEffect(() => {
    if (online && allItems.length) void saveMenuSnapshot(allItems);
  }, [online, allItems]);
  const catalog = allItems.length > 0 ? allItems : offlineMenu;

  // Ids of this branch's categories — an item is "carried" here if it's in one.
  const branchCatIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((it) => {
      // Only items carried at this branch (skip the filter until categories load
      // so the grid doesn't flash empty).
      if (!categoriesLoading && !it.categories?.some((c) => branchCatIds.has(c.id))) return false;
      if (categoryId !== "all" && !it.categories?.some((c) => c.id === categoryId)) return false;
      if (q && !`${it.name} ${it.description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [catalog, categoryId, search, branchCatIds, categoriesLoading]);

  // Stable handler so memoized MenuCards don't re-render on every POS state change
  // (branch switch, cart edits, search) — only when their own item changes.
  const handleAddItem = useCallback((it: MenuItem) => setCustomizing(it), [setCustomizing]);

  const [orderType, setOrderType] = useState<OrderType>("table");
  const [tableId, setTableId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountKind, setDiscountKind] = useState<"percentage" | "amount">("percentage");
  const [discountInput, setDiscountInput] = useState("");
  const [taxId, setTaxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { tables } = useTables(orderBranchId);
  // When set, the cart is editing an existing order instead of creating one.
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderNumber, setEditingOrderNumber] = useState<string>("");
  const [loadOrderSel, setLoadOrderSel] = useState("");
  // Every running order in the branch (any type) — the "load open order" picker.
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  // Cancel-the-loaded-order dialog (reason required).
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // True once the cashier changes the tax, so the default won't override them.
  const taxTouched = useRef(false);

  const refreshActiveOrders = useCallback(async () => {
    try {
      setActiveOrders(await orderService.active(orderBranchId ?? undefined));
    } catch {
      /* non-fatal — the picker just won't populate */
    }
  }, [orderBranchId]);

  useEffect(() => {
    void refreshActiveOrders();
  }, [refreshActiveOrders]);

  // Restore an in-progress cart after a refresh.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as PersistedCart;
        setCart(p.cart ?? []);
        setOrderType(p.orderType ?? "table");
        setTableId(p.tableId ?? "");
        setDiscountKind(p.discountKind ?? "percentage");
        setDiscountInput(p.discountInput ?? "");
        setTaxId(p.taxId ?? "");
        // A restored in-progress order keeps its own tax — don't auto-override.
        if (p.cart?.length) taxTouched.current = true;
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  // Auto-apply the configured default tax to a fresh order (overridable).
  useEffect(() => {
    if (!editingOrderId && !taxTouched.current && defaultTax && !taxId) {
      setTaxId(defaultTax);
    }
  }, [defaultTax, editingOrderId, taxId]);

  // Persist on every change. Skip the first run so mount doesn't clobber the
  // restore above before its state has committed.
  const skipFirstPersist = useRef(true);
  useEffect(() => {
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    const payload: PersistedCart = {
      cart,
      orderType,
      tableId,
      discountKind,
      discountInput,
      taxId,
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  }, [cart, orderType, tableId, discountKind, discountInput, taxId]);

  const subtotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [cart],
  );

  const discountAmount = useMemo(() => {
    const raw = Number(discountInput) || 0;
    const amount = discountKind === "percentage" ? (subtotal * raw) / 100 : raw;
    return Math.min(Math.max(0, amount), subtotal);
  }, [discountInput, discountKind, subtotal]);

  // taxId encodes a single tax ("t:<id>") or a tax group ("g:<id>").
  const selectedTax = useMemo(() => {
    if (taxId.startsWith("t:")) {
      const t = taxes.find((x) => String(x.id) === taxId.slice(2));
      return t ? { label: `${t.name} ${t.rate}%`, rate: t.rate } : null;
    }
    if (taxId.startsWith("g:")) {
      const g = taxGroups.find((x) => String(x.id) === taxId.slice(2));
      return g ? { label: `${g.name} ${groupRate(g)}%`, rate: groupRate(g) } : null;
    }
    return null;
  }, [taxId, taxes, taxGroups]);
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = selectedTax ? round2((taxableBase * selectedTax.rate) / 100) : 0;
  const total = Math.max(0, round2(taxableBase + taxAmount));

  const addLine = (line: CustomizedLine) => {
    setCart((prev) => {
      const found = prev.find((l) => l.key === line.key);
      if (found) {
        return prev.map((l) =>
          l.key === line.key ? { ...l, quantity: l.quantity + line.quantity } : l,
        );
      }
      return [...prev, line];
    });
  };
  const setQty = (key: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    );
  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key));
  const clearCart = () => {
    setCart([]);
    setTableId("");
    setCustomer(null);
    setCustomerPhone("");
    setCustomerAddress("");
    setDiscountInput("");
    setTaxId("");
    taxTouched.current = false; // let the default re-apply for the next order
    setEditingOrderId(null);
    setEditingOrderNumber("");
    setLoadOrderSel("");
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  /** Load a fetched order into the cart for editing. */
  const applyLoadedOrder = (order: Order) => {
    setCart(
      order.items.map((it, i) => ({
        key: `${it.menuItemId ?? it.name}|${it.notes ?? ""}|${i}`,
        menuItemId: it.menuItemId ?? "",
        name: it.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        notes: it.notes ?? undefined,
      })),
    );
    setOrderType(order.orderType);
    setTableId(order.tableId ?? "");
    setDiscountKind("amount");
    setDiscountInput(order.discount ? String(order.discount) : "");
    // Best-effort: re-select the tax whose amount matches the saved order tax.
    const taxable = Math.max(0, order.subtotal - order.discount);
    const matched = order.tax
      ? taxes.find((t) => round2((taxable * t.rate) / 100) === round2(order.tax))
      : undefined;
    setTaxId(matched ? `t:${matched.id}` : "");
    taxTouched.current = true; // respect the loaded order's tax
    setEditingOrderId(order.id);
    setEditingOrderNumber(order.orderNumber);
  };

  /** Load one of the running orders (picked from the list) into the cart. */
  const loadOrder = (orderId: string) => {
    setLoadOrderSel(orderId);
    if (!orderId) return;
    const order = activeOrders.find((o) => o.id === orderId);
    if (!order) {
      return;
    }
    applyLoadedOrder(order);
  };

  /** Cancel the currently-loaded order (requires a reason), then reset the cart. */
  const cancelLoadedOrder = async () => {
    if (!editingOrderId) return;
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelError(true);
      return;
    }
    setCancelling(true);
    try {
      await orderService.update(editingOrderId, {
        status: "cancelled",
        cancellationReason: reason,
      });
      setCancelOpen(false);
      setCancelReason("");
      setCancelError(false);
      clearCart();
      void refreshActiveOrders();
    } catch {
    } finally {
      setCancelling(false);
    }
  };

  const canPlace = cart.length > 0 && !submitting && (orderType !== "table" || !!tableId);

  /** Punch the order. `payment` null = pay later; a value = paid now. */
  const submitOrder = async (payment: PaymentResult | null) => {
    const paymentNote = !payment
      ? "Unpaid — pay later"
      : payment.method === "cash"
        ? `Payment: Cash · Received ${formatMoney(payment.received ?? 0)} · Change ${formatMoney(payment.change ?? 0)}`
        : payment.method === "card"
          ? `Payment: Card ****${payment.detail}`
          : payment.method === "mfs"
            ? `Payment: MFS · Txn ${payment.detail}`
            : `Payment: Other · ${payment.detail}`;

    const items = cart.map((l) => ({
      menuItemId: l.menuItemId || undefined,
      name: l.name,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      ...(l.notes ? { notes: l.notes } : {}),
    }));
    const discount = discountAmount > 0 ? round2(discountAmount) : 0;
    const tax = round2(taxAmount);

    // Offline: queue the order on this device (cash / pay-later only) and let it
    // sync automatically when the connection returns.
    if (!online) {
      if (editingOrderId) {
        return;
      }
      if (payment && payment.method !== "cash") {
        return;
      }
      const payload: CreateOrderInput = {
        orderType,
        items,
        notes: paymentNote,
        paymentStatus: payment ? "paid" : "unpaid",
        ...(orderBranchId ? { branchId: orderBranchId } : {}),
        ...(payment ? { paymentMethod: paymentMethodLabel(payment) } : {}),
        ...(discount > 0 ? { discount } : {}),
        ...(tax > 0 ? { tax } : {}),
        ...(orderType === "table" && tableId ? { tableId } : {}),
        ...(customer ? { customerId: customer.id, customerName: customer.name } : {}),
        ...(customerPhone || customer?.phone
          ? { customerPhone: customerPhone || customer?.phone || undefined }
          : {}),
        ...(orderType === "online" && (customerAddress || customer?.address)
          ? { customerAddress: customerAddress || customer?.address || undefined }
          : {}),
      };
      enqueue(payload);
      setPaymentOpen(false);
      clearCart();
      return;
    }

    setSubmitting(true);
    try {
      let orderNumber: string;
      let orderId: string;
      if (editingOrderId) {
        const order = await orderService.update(editingOrderId, {
          items,
          discount,
          tax,
          notes: paymentNote,
          // Collecting payment on a loaded order (e.g. a served table) closes it out.
          ...(payment
            ? {
                status: "completed",
                paymentStatus: "paid",
                paymentMethod: paymentMethodLabel(payment),
              }
            : {}),
          ...(orderType === "table" && tableId ? { tableId } : {}),
        });
        orderNumber = order.orderNumber;
        orderId = order.id;
      } else {
        const payload: CreateOrderInput = {
          orderType,
          items,
          notes: paymentNote,
          paymentStatus: payment ? "paid" : "unpaid",
          ...(orderBranchId ? { branchId: orderBranchId } : {}),
          ...(payment ? { paymentMethod: paymentMethodLabel(payment) } : {}),
          ...(discount > 0 ? { discount } : {}),
          ...(tax > 0 ? { tax } : {}),
          ...(orderType === "table" && tableId ? { tableId } : {}),
          ...(customer ? { customerId: customer.id, customerName: customer.name } : {}),
          ...(customerPhone || customer?.phone
            ? { customerPhone: customerPhone || customer?.phone || undefined }
            : {}),
          ...(orderType === "online" && (customerAddress || customer?.address)
            ? { customerAddress: customerAddress || customer?.address || undefined }
            : {}),
        };
        const order = await orderService.create(payload);
        orderNumber = order.orderNumber;
        orderId = order.id;
      }

      if (payment) {
        // Record the payment as a transaction (attached to the open register).
        try {
          await transactionService.create({
            type: "sale",
            method: payment.method,
            amount: total,
            orderId,
            ...(orderBranchId ? { branchId: orderBranchId } : {}),
          });
        } catch {
          /* payment recorded on the order note regardless; non-fatal */
        }
        printReceipt({
          orderNumber,
          businessName,
          logoUrl: businessLogo,
          lines: cart.map((l) => ({
            name: l.name,
            qty: l.quantity,
            price: l.unitPrice * l.quantity,
          })),
          subtotal,
          discount,
          tax,
          taxLabel: selectedTax?.label,
          total,
          paymentNote,
        });
      }
      setPaymentOpen(false);
      clearCart();
      void refreshActiveOrders();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <OfflineBar
        online={online}
        pending={pending}
        failed={failed}
        syncing={syncing}
        onSync={syncNow}
        onReview={() => setReviewOpen(true)}
      />
      <QueuedOrdersDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        queue={queue}
        online={online}
        syncing={syncing}
        onSync={syncNow}
        onRetry={retry}
        onDiscard={discard}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Menu */}
        <div className="min-w-0">
          {/* Search + categories float just below the sticky Topbar (h-16) while the
            item grid scrolls under them; bg-subtle matches the page so nothing peeks. */}
          <div className="sticky top-16 z-20 -mx-1 bg-subtle px-1 pb-2 pt-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Menu Item"
                className="h-11 rounded-xl pl-11"
                aria-label="Search menu"
              />
            </div>

            {/* Category cards — "All Items" stays pinned on the left; the rest
            drag-to-scroll (mouse) with no visible scrollbar. */}
            <div className="mt-4 flex items-start gap-2.5">
              <CategoryCard
                label="All Items"
                active={categoryId === "all"}
                onClick={() => setCategoryId("all")}
              />
              <div
                ref={catDrag.ref}
                {...catDrag.handlers}
                className={cn(
                  "no-scrollbar flex min-w-0 flex-1 gap-2.5 overflow-x-auto",
                  catDrag.className,
                )}
              >
                {categoriesLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="size-[68px] shrink-0 rounded-2xl" />
                    ))
                  : categories.map((c) => (
                      <CategoryCard
                        key={c.id}
                        label={c.name}
                        imageUrl={c.imageUrl}
                        active={categoryId === c.id}
                        onClick={() => setCategoryId(c.id)}
                      />
                    ))}
              </div>
            </div>
          </div>

          {/* Items — lazy loaded page by page */}
          <div className="mt-4">
            {loading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <Card className="p-0">
                <EmptyState
                  className="py-12"
                  icon={UtensilsCrossed}
                  title="No menu items"
                  description="Add items to your menu to sell them here."
                />
              </Card>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
                {items.map((it) => (
                  <MenuCard key={it.id} item={it} onAdd={handleAddItem} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart — sticks below the 64px sticky Topbar (h-16), with a 16px gap.
          On lg it's capped to the viewport so only the item list scrolls (below),
          keeping the order-type controls, totals and Pay buttons always visible. */}
        <Card className="flex h-fit flex-col p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-4 text-brand" />
            <h2 className="font-semibold text-ink">Current Order</h2>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="ml-auto text-xs text-muted-foreground hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          {/* Scrollable order body — setup controls + line items scroll together,
            so the discount/tax/totals and Pay buttons below stay pinned in view. */}
          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            {/* Load any running order (search by order #) to edit / settle it */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Dropdown
                  className="flex-1"
                  value={loadOrderSel}
                  onChange={(v) => loadOrder(v)}
                  searchable
                  placeholder={
                    activeOrders.length
                      ? "Load a running order (search by #)…"
                      : "No running orders"
                  }
                  aria-label="Load a running order"
                  options={activeOrders.map((o) => {
                    const who = o.table?.name ?? o.customerName ?? undefined;
                    return {
                      value: o.id,
                      label: `${o.orderNumber} · ${ORDER_STATUS_META[o.status].label}`,
                      sublabel:
                        [ORDER_TYPE_META[o.orderType].label, who, formatMoney(o.total)]
                          .filter(Boolean)
                          .join(" · ") || undefined,
                    };
                  })}
                />
              </div>
              {editingOrderId && (
                <div className="flex items-center justify-between rounded-lg border border-brand/30 bg-brand-tint/40 px-3 py-1.5 text-xs">
                  <span className="font-medium text-brand-deep">Editing {editingOrderNumber}</span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-muted-foreground hover:text-ink"
                  >
                    New order
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3">
              <CustomerSelect value={customer} onChange={setCustomer} />
            </div>

            <div className="mt-3">
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-border p-1">
                {ORDER_TYPES.map((t) => {
                  const active = orderType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setOrderType(t.value)}
                      className={cn(
                        "rounded-lg py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-secondary hover:text-ink",
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {orderType === "table" && (
                <div className="mt-2">
                  <Dropdown
                    value={tableId}
                    onChange={(v) => setTableId(v)}
                    searchable
                    placeholder="— Select a table —"
                    aria-label="Table"
                    options={tables.map((t) => ({
                      value: t.id,
                      label: t.name,
                      sublabel: t.area?.name || undefined,
                    }))}
                  />
                </div>
              )}
            </div>

            {orderType === "online" && (
              <div className="mt-3 space-y-2">
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={customer?.phone ? `Phone (${customer.phone})` : "Phone"}
                  className="h-9"
                />
                <Input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder={
                    customer?.address ? `Address (${customer.address})` : "Delivery address"
                  }
                  className="h-9"
                />
              </div>
            )}

            <div className="mt-3 border-t border-border pt-3">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Tap menu items to add them.
                </p>
              ) : (
                <ul className="space-y-3">
                  {cart.map((l) => (
                    <li key={l.key} className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                        {l.notes && (
                          <p className="truncate text-xs text-muted-foreground">{l.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{formatMoney(l.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          aria-label="Decrease"
                          onClick={() => setQty(l.key, -1)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-5 text-center text-sm font-medium">{l.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          aria-label="Increase"
                          onClick={() => setQty(l.key, 1)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => removeLine(l.key)}
                        className="mt-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* end scrollable order body */}

          {/* Discount */}
          <div className="mt-3 flex items-stretch gap-2">
            <Dropdown
              value={discountKind}
              onChange={(v) => setDiscountKind(v as "percentage" | "amount")}
              aria-label="Discount type"
              className="w-36 shrink-0"
              options={[
                { value: "percentage", label: "Percentage" },
                { value: "amount", label: "Amount" },
              ]}
            />
            <Input
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="Add Discount"
              inputMode="decimal"
              className="h-9 flex-1"
            />
          </div>

          {/* Tax */}
          <div className="mt-2">
            <Dropdown
              value={taxId}
              onChange={(v) => {
                taxTouched.current = true;
                setTaxId(v);
              }}
              placeholder="Add Tax"
              aria-label="Tax"
              options={[
                { value: "", label: "No tax" },
                ...taxes
                  .filter((t) => t.isActive)
                  .map((t) => ({
                    value: `t:${t.id}`,
                    label: `${t.name} · ${t.rate}%`,
                    sublabel: t.code ?? undefined,
                  })),
                ...taxGroups
                  .filter((g) => g.isActive)
                  .map((g) => ({
                    value: `g:${g.id}`,
                    label: `${g.name} · ${groupRate(g)}%`,
                    sublabel: "Group",
                  })),
              ]}
            />
          </div>

          <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sub Total</span>
              <span className="font-medium text-ink">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-ink">{formatMoney(discountAmount)}</span>
            </div>
            {selectedTax && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tax ({selectedTax.label})</span>
                <span className="font-medium text-ink">{formatMoney(taxAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-1.5">
              <span className="font-semibold text-ink">Total</span>
              <span className="text-lg font-bold text-ink">{formatMoney(total)}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={!canPlace} onClick={() => void submitOrder(null)}>
              {submitting && !paymentOpen && <Loader2 className="size-4 animate-spin" />}
              {editingOrderId ? "Update (Pay Later)" : "Punch (Pay Later)"}
            </Button>
            <Button disabled={!canPlace} onClick={() => setPaymentOpen(true)}>
              {editingOrderId ? "Pay & Update" : "Pay & Punch"}
            </Button>
          </div>
          {editingOrderId && (
            <Button
              variant="destructive"
              className="mt-2 w-full"
              onClick={() => {
                setCancelReason("");
                setCancelError(false);
                setCancelOpen(true);
              }}
            >
              <Ban className="size-4" />
              Cancel order {editingOrderNumber}
            </Button>
          )}
          <Button
            variant="ghost"
            className="mt-2 w-full text-muted-foreground hover:text-destructive"
            disabled={cart.length === 0 && !editingOrderId}
            onClick={clearCart}
          >
            {editingOrderId ? "Discard changes" : "Cancel"}
          </Button>
          {orderType === "table" && !tableId && cart.length > 0 && (
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              Select a table to place this order.
            </p>
          )}
        </Card>

        <PaymentDialog
          open={paymentOpen}
          total={total}
          submitting={submitting}
          onOpenChange={setPaymentOpen}
          onConfirm={(payment: PaymentResult) => void submitOrder(payment)}
        />

        <Dialog open={cancelOpen} onOpenChange={(open) => !cancelling && setCancelOpen(open)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel order {editingOrderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="pos-cancel-reason">Reason for cancellation</Label>
              <textarea
                id="pos-cancel-reason"
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelError) setCancelError(false);
                }}
                rows={3}
                autoFocus
                placeholder="e.g. Customer changed their mind, item unavailable…"
                aria-invalid={cancelError}
                className="flex w-full rounded-xl border border-input bg-white px-3.5 py-2 text-sm text-ink shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20"
              />
              {cancelError && (
                <p className="text-xs text-destructive">
                  A reason is required to cancel this order.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
                Keep order
              </Button>
              <Button
                variant="destructive"
                onClick={() => void cancelLoadedOrder()}
                disabled={cancelling}
              >
                {cancelling && <Loader2 className="size-4 animate-spin" />}
                Cancel order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ItemCustomizeDialog
          item={customizing}
          onOpenChange={(open) => !open && setCustomizing(null)}
          onAdd={addLine}
        />
      </div>
    </div>
  );
}

function CategoryCard({
  label,
  imageUrl,
  active,
  onClick,
}: {
  label: string;
  imageUrl?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border bg-card p-2.5 text-center transition-colors",
        active ? "border-brand bg-brand-tint/30" : "border-border hover:border-brand/40",
      )}
    >
      <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-secondary">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <UtensilsCrossed className="size-4 text-muted-foreground" />
        )}
      </span>
      <span
        className={cn(
          "line-clamp-2 text-[12px] font-bold leading-tight",
          active ? "text-brand" : "text-ink",
        )}
      >
        {label}
      </span>
    </button>
  );
}

const MenuCard = memo(function MenuCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => onAdd(item)}
        disabled={!item.isAvailable}
        className="relative aspect-[4/3] w-full overflow-hidden bg-secondary disabled:opacity-60"
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="size-full object-cover transition-transform duration-200 hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <UtensilsCrossed className="size-6 text-muted-foreground" />
          </span>
        )}
        {!item.isAvailable && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-xs font-semibold text-ink">
            Unavailable
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="line-clamp-2 text-[15px] font-semibold text-ink">{item.name}</p>
        <div className="mt-auto flex items-center justify-between pt-2.5">
          <span className="text-[15px] font-semibold text-ink">{formatMoney(item.price)}</span>
          <button
            type="button"
            onClick={() => onAdd(item)}
            disabled={!item.isAvailable}
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:opacity-40"
          >
            <ShoppingBag className="size-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
});
