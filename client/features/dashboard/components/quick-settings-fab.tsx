"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  DoorOpen,
  GripHorizontal,
  Globe,
  Loader2,
  ShoppingBag,
  Store,
  Truck,
  Utensils,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { settingsService } from "@/features/app-settings/services/settings.service";
import { useSettingsGroup } from "@/features/app-settings/hooks/use-settings-group";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { branchService } from "@/features/branch/services/branch.service";
import type { Branch } from "@/features/branch/types/branch.types";
import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { orderService } from "@/features/order/services/order.service";
import type { Order } from "@/features/order/types/order.types";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";

const ON = "enable";
const OFF = "disable";
const PANEL_W = 400;

type TabKey = "live" | "table" | "order" | "branch";
const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "live", label: "Live", icon: ClipboardList },
  { key: "table", label: "Table", icon: Utensils },
  { key: "order", label: "Order", icon: ShoppingBag },
  { key: "branch", label: "Branch", icon: Store },
];

export function QuickSettingsFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick settings"
        aria-expanded={open}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform hover:scale-105 active:scale-95",
          open ? "bg-ink" : "bg-brand",
        )}
      >
        {open ? <X className="size-6" /> : <Zap className="size-6" />}
      </button>
      {open && <QuickSettingsPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function QuickSettingsPanel({ onClose }: { onClose: () => void }) {
  const role = useSession((s) => s.user?.role);
  // A single-branch manager has nothing to switch — drop the Branch tab.
  const visibleTabs = role === "branch_manager" ? TABS.filter((t) => t.key !== "branch") : TABS;

  const [tab, setTab] = useState<TabKey>("live");
  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - PANEL_W - 24 : 24,
    y: typeof window !== "undefined" ? Math.max(24, window.innerHeight - 460) : 24,
  }));
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({
      x: Math.min(Math.max(8, e.clientX - drag.current.dx), window.innerWidth - PANEL_W - 8),
      y: Math.min(Math.max(8, e.clientY - drag.current.dy), window.innerHeight - 56),
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      role="dialog"
      aria-label="Quick settings"
      style={{ left: pos.x, top: pos.y, width: PANEL_W }}
      className="fixed z-50 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-elevated)]"
    >
      {/* Draggable header */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex cursor-grab touch-none items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3 active:cursor-grabbing"
      >
        <Zap className="size-4 text-brand" />
        <span className="text-sm font-semibold text-ink">Quick settings</span>
        <GripHorizontal className="ml-auto size-4 text-muted-foreground" />
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground transition-colors hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Tabs on top */}
      <div className="border-b border-border p-2">
        <SegmentedTabs
          grow
          aria-label="Quick settings section"
          value={tab}
          onChange={(k) => setTab(k as TabKey)}
          tabs={visibleTabs.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
        />
      </div>

      {/* Tab content */}
      <div className="min-h-[220px] overflow-y-auto p-2">
        {tab === "live" && <LiveOrders />}
        {tab === "order" && (
          <SettingToggles
            group="order"
            onText="Accepting orders"
            offText="Stopped"
            items={[
              { key: "delivery", label: "Delivery", icon: Truck },
              { key: "takeaway", label: "Pickup / Takeaway", icon: ShoppingBag },
            ]}
          />
        )}
        {tab === "table" && (
          <SettingToggles
            group="reservation"
            onText="Open for bookings"
            offText="Closed"
            items={[{ key: "enabled", label: "Reservations", icon: CalendarClock }]}
          />
        )}
        {tab === "branch" && <BranchToggles />}
      </div>
    </div>
  );
}

// ── Live orders (running) ────────────────────────────────────────────────────
const ORDER_TYPE_ICON: Record<Order["orderType"], LucideIcon> = {
  table: Utensils,
  pos: ShoppingBag,
  online: Truck,
};

/** Compact "Xm" / "Xh Ym" elapsed since an ISO timestamp. */
function relMinutes(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Where the order goes — table name (dine-in) or customer/fulfillment otherwise. */
function whereLabel(o: Order): string {
  if (o.orderType === "table") return o.table?.name ? `Table ${o.table.name}` : "Dine-in";
  return o.customerName || (o.orderType === "online" ? "Delivery" : "Takeaway");
}

/** Live list of running orders for the selected branch (light poll for a glance). */
function LiveOrders() {
  const branchId = useScopedBranchId();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      orderService
        .active(branchId)
        .then((o) => active && setOrders(o))
        .catch(() => {})
        .finally(() => active && setLoading(false));
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [branchId]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">
        No running orders right now.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {orders.map((o) => {
          const Icon = ORDER_TYPE_ICON[o.orderType] ?? ShoppingBag;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setDetail(o)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-deep">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink">#{o.orderNumber}</span>
                  <OrderStatusPill status={o.status} />
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {whereLabel(o)} · {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                  {relMinutes(o.createdAt)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatMoney(o.total)}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  #{detail.orderNumber}
                  <OrderStatusPill status={detail.status} />
                </DialogTitle>
                <DialogDescription>
                  {whereLabel(detail)} · {relMinutes(detail.createdAt)} ·{" "}
                  {detail.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[45vh] space-y-2 overflow-y-auto py-1">
                {detail.items.map((it) => (
                  <div key={it.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 text-ink">
                      <span className="font-semibold tabular-nums">{it.quantity}×</span> {it.name}
                      {it.notes && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {it.notes}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatMoney(it.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatMoney(detail.subtotal)}</span>
                </div>
                {detail.discount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatMoney(detail.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-ink">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(detail.total)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Shared toggle row ────────────────────────────────────────────────────────
function ToggleRow({
  icon: Icon,
  label,
  subtitle,
  on,
  busy,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  on: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary disabled:opacity-60"
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          on ? "bg-brand-tint text-brand-deep" : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      {busy ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <span
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
            on ? "bg-brand" : "bg-border",
          )}
        >
          <span
            className={cn(
              "inline-block size-4 rounded-full bg-white shadow transition-transform",
              on ? "translate-x-[18px]" : "translate-x-0.5",
            )}
          />
        </span>
      )}
    </button>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-2 p-1">
      <div className="h-12 animate-pulse rounded-xl bg-secondary" />
      <div className="h-12 animate-pulse rounded-xl bg-secondary" />
    </div>
  );
}

// ── Settings-group toggles (order / reservation) ─────────────────────────────
function SettingToggles({
  group,
  items,
  onText,
  offText,
}: {
  group: string;
  items: { key: string; label: string; icon: LucideIcon }[];
  onText: string;
  offText: string;
}) {
  const { values, set, loading } = useSettingsGroup(group);
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (key: string) => {
    const next = (values[key] || ON) === OFF ? ON : OFF;
    set(key, next);
    setBusy(key);
    try {
      await settingsService.saveGroup(group, { ...values, [key]: next });
      toast(`${items.find((i) => i.key === key)?.label} ${next === ON ? "resumed" : "stopped"}`, {
        tone: next === ON ? "success" : "error",
      });
    } catch {
      set(key, next === ON ? OFF : ON);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <TabSkeleton />;
  return (
    <div className="space-y-1">
      {items.map((it) => {
        const on = (values[it.key] || ON) !== OFF;
        return (
          <ToggleRow
            key={it.key}
            icon={it.icon}
            label={it.label}
            subtitle={on ? onText : offText}
            on={on}
            busy={busy === it.key}
            onToggle={() => toggle(it.key)}
          />
        );
      })}
    </div>
  );
}

// ── Branch toggles (per-branch operational flags) ────────────────────────────
type BranchFlag =
  "isOpen" | "onlineOrderingEnabled" | "deliveryEnabled" | "pickupEnabled" | "reservationsEnabled";
const BRANCH_FLAGS: {
  key: BranchFlag;
  label: string;
  icon: LucideIcon;
  on: string;
  off: string;
}[] = [
  { key: "isOpen", label: "Store open", icon: DoorOpen, on: "Open", off: "Closed" },
  {
    key: "onlineOrderingEnabled",
    label: "Online ordering",
    icon: Globe,
    on: "Enabled",
    off: "Off",
  },
  { key: "deliveryEnabled", label: "Delivery", icon: Truck, on: "Enabled", off: "Off" },
  { key: "pickupEnabled", label: "Pickup", icon: ShoppingBag, on: "Enabled", off: "Off" },
  {
    key: "reservationsEnabled",
    label: "Reservations",
    icon: CalendarClock,
    on: "Enabled",
    off: "Off",
  },
];

function BranchToggles() {
  const { branches, loading } = useBranches();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Partial<Branch>>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <TabSkeleton />;
  if (branches.length === 0)
    return <p className="p-4 text-center text-sm text-muted-foreground">No branches yet.</p>;

  const id = selectedId ?? branches[0].id;
  const base = branches.find((b) => b.id === id) ?? branches[0];
  const branch = { ...base, ...overrides[base.id] };

  const toggle = async (flag: BranchFlag) => {
    const next = !branch[flag];
    setOverrides((o) => ({ ...o, [branch.id]: { ...o[branch.id], [flag]: next } }));
    setBusy(flag);
    try {
      await branchService.update(branch.id, { [flag]: next });
      toast(`Branch updated`, { tone: next ? "success" : "error" });
    } catch {
      setOverrides((o) => ({ ...o, [branch.id]: { ...o[branch.id], [flag]: !next } }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      {branches.length > 1 && (
        <Dropdown
          value={id}
          onChange={setSelectedId}
          options={branches.map((b) => ({
            value: b.id,
            label: b.name,
            sublabel: b.city ?? undefined,
          }))}
          aria-label="Branch"
          searchable={branches.length > 6}
        />
      )}
      <div className="space-y-1">
        {BRANCH_FLAGS.map((f) => (
          <ToggleRow
            key={f.key}
            icon={f.icon}
            label={f.label}
            subtitle={branch[f.key] ? f.on : f.off}
            on={Boolean(branch[f.key])}
            busy={busy === f.key}
            onToggle={() => toggle(f.key)}
          />
        ))}
      </div>
    </div>
  );
}
