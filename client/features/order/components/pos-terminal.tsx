"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { Dropdown } from "@/components/ui/dropdown";
import { usePaginatedMenuItems } from "@/features/menu/hooks/use-paginated-menu-items";
import { useCategories } from "@/features/category/hooks/use-categories";
import { useTables } from "@/features/table/hooks/use-tables";
import { useTaxes } from "@/features/tax/hooks/use-taxes";
import { useTaxGroups } from "@/features/tax/hooks/use-tax-groups";
import { useDefaultTax } from "@/features/tax/hooks/use-default-tax";
import { groupRate } from "@/features/tax/services/tax-group.service";
import { CustomerSelect } from "@/features/customer/components/customer-select";
import type { Customer } from "@/features/customer/types/customer.types";
import { orderService } from "@/features/order/services/order.service";
import { transactionService } from "@/features/transaction/services/transaction.service";
import {
  ItemCustomizeDialog,
  type CustomizedLine,
} from "@/features/order/components/item-customize-dialog";
import {
  PaymentDialog,
  type PaymentResult,
} from "@/features/order/components/payment-dialog";
import { printReceipt } from "@/features/order/lib/print-receipt";
import type { MenuItem } from "@/features/menu/types/menu.types";
import type {
  CreateOrderInput,
  OrderType,
} from "@/features/order/types/order.types";

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

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
  const { categories, loading: categoriesLoading } = useCategories();
  const { tables } = useTables();
  const { taxes } = useTaxes();
  const { groups: taxGroups } = useTaxGroups();
  const { defaultTax } = useDefaultTax();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);

  const { items, loading, loadingMore, hasMore, loadMore } = usePaginatedMenuItems({
    categoryId,
    search,
  });

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
  // When set, the cart is editing an existing order instead of creating one.
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderNumber, setEditingOrderNumber] = useState<string>("");
  const [loadTableId, setLoadTableId] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  // True once the cashier changes the tax, so the default won't override them.
  const taxTouched = useRef(false);

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

  // Infinite scroll: load the next page when the sentinel scrolls into view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

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
  const removeLine = (key: string) =>
    setCart((prev) => prev.filter((l) => l.key !== key));
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
    setLoadTableId("");
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  /** Load a table's open order into the cart for editing. */
  const loadTableOrder = async (tid: string) => {
    setLoadTableId(tid);
    if (!tid) return;
    setLoadingOrder(true);
    try {
      const order = await orderService.byTable(tid);
      if (!order) {
        toast("No open order for this table", { tone: "error" });
        setEditingOrderId(null);
        setEditingOrderNumber("");
        return;
      }
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
      toast(`Loaded ${order.orderNumber}`, { tone: "success" });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't load order", { tone: "error" });
    } finally {
      setLoadingOrder(false);
    }
  };

  const canPlace =
    cart.length > 0 && !submitting && (orderType !== "table" || !!tableId);

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
          ...(orderType === "table" && tableId ? { tableId } : {}),
        });
        orderNumber = order.orderNumber;
        orderId = order.id;
        toast(`Order ${orderNumber} updated`, { tone: "success" });
      } else {
        const payload: CreateOrderInput = {
          orderType,
          items,
          notes: paymentNote,
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
        toast(`Order ${orderNumber} placed`, { tone: "success" });
      }

      if (payment) {
        // Record the payment as a transaction (attached to the open register).
        try {
          await transactionService.create({
            type: "sale",
            method: payment.method,
            amount: total,
            orderId,
          });
        } catch {
          /* payment recorded on the order note regardless; non-fatal */
        }
        printReceipt({
          orderNumber,
          lines: cart.map((l) => ({ name: l.name, qty: l.quantity, price: l.unitPrice * l.quantity })),
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
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't save order", {
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      {/* Menu */}
      <div className="min-w-0">
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

        {/* Category cards — skeleton until every category has loaded */}
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
          {categoriesLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="size-[68px] shrink-0 rounded-2xl" />
            ))
          ) : (
            <>
              <CategoryCard
                label="All Items"
                active={categoryId === "all"}
                onClick={() => setCategoryId("all")}
              />
              {categories.map((c) => (
                <CategoryCard
                  key={c.id}
                  label={c.name}
                  imageUrl={c.imageUrl}
                  active={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                />
              ))}
            </>
          )}
        </div>

        {/* Items — lazy loaded page by page */}
        <div className="mt-5">
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
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
                {items.map((it) => (
                  <MenuCard key={it.id} item={it} onAdd={() => setCustomizing(it)} />
                ))}
                {loadingMore &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={`more-${i}`} className="h-64 rounded-2xl" />
                  ))}
              </div>
              {/* Sentinel: triggers the next page as it nears the viewport */}
              {hasMore && <div ref={sentinelRef} className="h-8" />}
            </>
          )}
        </div>
      </div>

      {/* Cart */}
      <Card className="flex h-fit flex-col p-4 lg:sticky lg:top-4">
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

        {/* Load an existing open order by table to edit it */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Dropdown
              className="flex-1"
              value={loadTableId}
              onChange={(v) => void loadTableOrder(v)}
              disabled={loadingOrder}
              searchable
              placeholder="Load open order by table…"
              aria-label="Load open order by table"
              options={tables.map((t) => ({
                value: t.id,
                label: t.name,
                sublabel: t.area?.name ?? undefined,
              }))}
            />
            {loadingOrder && <Loader2 className="size-4 shrink-0 animate-spin text-brand" />}
          </div>
          {editingOrderId && (
            <div className="flex items-center justify-between rounded-lg border border-brand/30 bg-brand-tint/40 px-3 py-1.5 text-xs">
              <span className="font-medium text-brand-deep">
                Editing {editingOrderNumber}
              </span>
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

        <div className="mt-3 rounded-xl border border-border p-3">
          <p className="mb-2 text-sm font-medium text-ink">Select Order Type</p>
          <div className="grid grid-cols-3 gap-2">
            {ORDER_TYPES.map((t) => {
              const active = orderType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setOrderType(t.value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-brand bg-brand-tint/40 text-brand-deep"
                      : "border-border bg-card text-muted-foreground hover:border-brand/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-3.5 items-center justify-center rounded-full border",
                      active ? "border-brand" : "border-muted-foreground/40",
                    )}
                  >
                    {active && <span className="size-1.5 rounded-full bg-brand" />}
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {orderType === "table" && (
            <select
              className={cn(SELECT_CLASS, "mt-3")}
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            >
              <option value="">— Select a table —</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.area?.name ? ` · ${t.area.name}` : ""}
                </option>
              ))}
            </select>
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
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(l.unitPrice)}
                    </p>
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
                    <span className="w-5 text-center text-sm font-medium">
                      {l.quantity}
                    </span>
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

        {/* Discount */}
        <div className="mt-3 flex items-stretch gap-2">
          <select
            value={discountKind}
            onChange={(e) => setDiscountKind(e.target.value as "percentage" | "amount")}
            className="h-9 shrink-0 appearance-none rounded-lg border border-input bg-white px-2.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand"
          >
            <option value="percentage">Percentage</option>
            <option value="amount">Amount</option>
          </select>
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
          <Button
            variant="outline"
            disabled={!canPlace}
            onClick={() => void submitOrder(null)}
          >
            {submitting && !paymentOpen && <Loader2 className="size-4 animate-spin" />}
            {editingOrderId ? "Update (Pay Later)" : "Punch (Pay Later)"}
          </Button>
          <Button disabled={!canPlace} onClick={() => setPaymentOpen(true)}>
            {editingOrderId ? "Pay & Update" : "Pay & Punch"}
          </Button>
        </div>
        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground hover:text-destructive"
          disabled={cart.length === 0 && !editingOrderId}
          onClick={clearCart}
        >
          Cancel
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

      <ItemCustomizeDialog
        item={customizing}
        onOpenChange={(open) => !open && setCustomizing(null)}
        onAdd={addLine}
      />
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

function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={onAdd}
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
            onClick={onAdd}
            disabled={!item.isAvailable}
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:opacity-40"
          >
            <ShoppingBag className="size-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
