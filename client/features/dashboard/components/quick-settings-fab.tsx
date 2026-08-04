"use client";

import { useRef, useState } from "react";
import {
  CalendarClock,
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

import { Dropdown } from "@/components/ui/dropdown";
import { settingsService } from "@/features/app-settings/services/settings.service";
import { useSettingsGroup } from "@/features/app-settings/hooks/use-settings-group";
import { useBranches } from "@/features/branch/hooks/use-branches";
import { branchService } from "@/features/branch/services/branch.service";
import type { Branch } from "@/features/branch/types/branch.types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ON = "enable";
const OFF = "disable";
const PANEL_W = 400;

type TabKey = "table" | "order" | "branch";
const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
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
  const [tab, setTab] = useState<TabKey>("order");
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
      <div className="flex gap-1 border-b border-border p-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                on
                  ? "bg-brand-tint text-brand-deep"
                  : "text-muted-foreground hover:bg-secondary hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[220px] overflow-y-auto p-2">
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
      toast("Couldn't update — try again", { tone: "error" });
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
  | "isOpen"
  | "onlineOrderingEnabled"
  | "deliveryEnabled"
  | "pickupEnabled"
  | "reservationsEnabled";
const BRANCH_FLAGS: { key: BranchFlag; label: string; icon: LucideIcon; on: string; off: string }[] =
  [
    { key: "isOpen", label: "Store open", icon: DoorOpen, on: "Open", off: "Closed" },
    { key: "onlineOrderingEnabled", label: "Online ordering", icon: Globe, on: "Enabled", off: "Off" },
    { key: "deliveryEnabled", label: "Delivery", icon: Truck, on: "Enabled", off: "Off" },
    { key: "pickupEnabled", label: "Pickup", icon: ShoppingBag, on: "Enabled", off: "Off" },
    { key: "reservationsEnabled", label: "Reservations", icon: CalendarClock, on: "Enabled", off: "Off" },
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
      toast("Couldn't update branch — try again", { tone: "error" });
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
