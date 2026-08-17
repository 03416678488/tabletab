"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Check,
  Loader2,
  Minus,
  Plus,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { MenuItemCard } from "@/features/order/components/menu-item-card";
import { ModifierSheet } from "@/features/order/components/modifier-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { fetchStorefrontProducts } from "@/features/storefront/services/storefront-catalog";
import { fetchAvailableTables } from "@/features/reserve/services/reservation-availability.service";
import { bookReservation } from "@/features/reserve/services/reservation.service";
import { dateOptions, formatTime12, generateSlots, isSlotBookable } from "@/lib/reservation-utils";
import type { ReservationConfig } from "@/features/reserve/services/reservation-config.service";
import type { Branch, MenuItem, OrderItem, Table } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type Step = "when" | "table" | "menu" | "details";

const STEPS: Step[] = ["when", "table", "menu", "details"];
const STEP_LABELS: Record<Step, string> = {
  when: "Date & party",
  table: "Choose table",
  menu: "Pre-order",
  details: "Your details",
};

interface ReservationBookingFlowProps {
  branch: Branch;
  config: ReservationConfig;
}

export function ReservationBookingFlow({ branch, config }: ReservationBookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("when");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [preOrder, setPreOrder] = useState<OrderItem[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const dates = useMemo(() => dateOptions(config.bookingWindowDays), [config.bookingWindowDays]);
  const timeSlots = useMemo(() => {
    return generateSlots(config.openTime, config.closeTime, config.slotDurationMins).filter((t) =>
      date ? isSlotBookable(date, t, config.minNoticeMins) : true,
    );
  }, [date, config.openTime, config.closeTime, config.slotDurationMins, config.minNoticeMins]);

  useEffect(() => {
    if (!date && dates[0]) setDate(dates[0].value);
  }, [date, dates]);

  useEffect(() => {
    fetchStorefrontProducts()
      .then(setMenuItems)
      .catch(() => setMenuItems([]));
  }, []);

  useEffect(() => {
    if (step !== "table" || !date || !time) return;
    let cancelled = false;
    setTablesLoading(true);
    fetchAvailableTables({
      branchId: branch.id,
      partySize,
      date,
      time,
      durationMins: config.slotDurationMins,
    })
      .then((list) => {
        if (!cancelled) {
          setTables(list);
          setSelectedTableId(null);
        }
      })
      .catch(() => {
        if (!cancelled) setTables([]);
      })
      .finally(() => {
        if (!cancelled) setTablesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, branch.id, partySize, date, time, config.slotDurationMins]);

  const stepIndex = STEPS.indexOf(step);
  const preOrderTotal = preOrder.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const addMenuItem = (item: MenuItem) => {
    if (item.modifiers.length > 0) {
      setModifierItem(item);
      setSheetOpen(true);
      return;
    }
    setPreOrder((prev) => {
      const existing = prev.find((p) => p.menuItemId === item.id && p.modifiers.length === 0);
      if (existing) {
        return prev.map((p) =>
          p.menuItemId === item.id && p.modifiers.length === 0
            ? { ...p, quantity: p.quantity + 1 }
            : p,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          modifiers: [],
        },
      ];
    });
  };

  const handleModifierAdd = (line: OrderItem) => {
    setPreOrder((prev) => [...prev, line]);
  };

  const canAdvance = () => {
    if (step === "when") return !!date && !!time && partySize >= 1;
    if (step === "table") return !!selectedTableId;
    if (step === "menu") return true;
    if (step === "details") return guestName.trim().length >= 2 && guestPhone.trim().length >= 6;
    return false;
  };

  const goNext = () => {
    if (!canAdvance()) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleSubmit = async () => {
    if (!selectedTableId || !date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const reservation = await bookReservation({
        branchId: branch.id,
        tableId: selectedTableId,
        partySize,
        date,
        time,
        durationMins: config.slotDurationMins,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
        source: "online",
      });
      router.push(`/reserve/confirm/${reservation.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Reserve a table</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {branch.name} · {config.slotDurationMins} min turn time
          </p>
        </div>

        {/* Step indicator */}
        <nav className="mb-8 flex gap-1 overflow-x-auto pb-1" aria-label="Booking steps">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                i <= stepIndex
                  ? "bg-brand-tint text-brand-deep"
                  : "bg-subtle text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                  i < stepIndex
                    ? "bg-brand text-primary-foreground"
                    : i === stepIndex
                      ? "bg-brand text-primary-foreground"
                      : "bg-border",
                )}
              >
                {i < stepIndex ? <Check className="size-3" /> : i + 1}
              </span>
              {STEP_LABELS[s]}
            </div>
          ))}
        </nav>

        {step === "when" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Users className="size-4 text-brand" />
                  Party size
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={partySize <= 1}
                    onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="font-display text-3xl font-bold text-ink">{partySize}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={partySize >= config.maxPartySize}
                    onClick={() => setPartySize((n) => Math.min(12, n + 1))}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Calendar className="size-4 text-brand" />
                  Date
                </div>
                <div className="flex flex-wrap gap-2">
                  {dates.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => {
                        setDate(d.value);
                        setTime("");
                      }}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        date === d.value
                          ? "bg-brand text-primary-foreground"
                          : "bg-subtle text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-5">
                <p className="text-sm font-medium text-ink">Time slot</p>
                {timeSlots.length === 0 ? (
                  <EmptyState
                    title="No slots available"
                    description={`Book at least ${config.minNoticeMins} minutes ahead, or try another date.`}
                  />
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {timeSlots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors",
                          time === t
                            ? "border-brand bg-brand-tint text-brand-deep"
                            : "border-border hover:border-brand/40",
                        )}
                      >
                        {formatTime12(t)}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "table" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tables that seat {partySize} and are free for your {formatTime12(time)} slot (
              {config.slotDurationMins} min).
            </p>
            {tablesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : tables.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="No tables available"
                description="Try a different time or smaller party size."
                action={
                  <Button variant="outline" onClick={goBack}>
                    Change date & time
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {tables.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTableId(t.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all",
                        selectedTableId === t.id
                          ? "border-brand bg-brand-tint/50 ring-2 ring-brand/30"
                          : "border-border bg-surface hover:border-brand/40",
                      )}
                    >
                      <div>
                        <p className="font-display font-semibold text-ink">{t.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.floor} · seats {t.seats ?? 2}
                        </p>
                      </div>
                      {selectedTableId === t.id && (
                        <StatusPill tone="brand">
                          <Check className="size-3" />
                          Selected
                        </StatusPill>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Optional — pre-order à la carte dishes for your table.
              </p>
              {preOrder.length > 0 && (
                <StatusPill tone="brand">{formatCurrency(preOrderTotal)}</StatusPill>
              )}
            </div>
            {preOrder.length > 0 && (
              <Card className="border-brand/20 bg-brand-tint/30">
                <CardContent className="p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-deep">
                    Your pre-order
                  </p>
                  <ul className="space-y-1 text-sm">
                    {preOrder.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span>
                          {item.quantity}× {item.name}
                        </span>
                        <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            <div className="space-y-3">
              {menuItems
                .filter((m) => m.isAvailable)
                .slice(0, 8)
                .map((item) => (
                  <MenuItemCard key={item.id} item={item} onAdd={addMenuItem} />
                ))}
            </div>
          </div>
        )}

        {step === "details" && (
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-xl bg-subtle/80 p-4 text-sm">
                <p className="font-medium text-ink">
                  {branch.name} · {tables.find((t) => t.id === selectedTableId)?.label}
                </p>
                <p className="text-muted-foreground">
                  {dates.find((d) => d.value === date)?.label} at {formatTime12(time)} · {partySize}{" "}
                  guests
                </p>
                {preOrder.length > 0 && (
                  <p className="mt-1 text-brand-deep">Pre-order: {formatCurrency(preOrderTotal)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-phone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+1 555-0100"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-email">Email (optional)</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground">
                  Add your email and we&apos;ll send your reservation details and status updates —
                  no account needed.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="special">Special requests (optional)</Label>
                <textarea
                  id="special"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  placeholder="Allergies, celebrations, seating preferences…"
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                />
              </div>
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer actions */}
        <div className="sticky bottom-0 -mx-4 mt-8 border-t border-border bg-subtle/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex gap-3">
            {stepIndex > 0 && (
              <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
                Back
              </Button>
            )}
            {step !== "details" ? (
              <Button type="button" className="flex-1" disabled={!canAdvance()} onClick={goNext}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1"
                disabled={!canAdvance() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Booking…
                  </>
                ) : (
                  "Request reservation"
                )}
              </Button>
            )}
            {step === "menu" && (
              <Button type="button" variant="ghost" onClick={goNext}>
                Skip
              </Button>
            )}
          </div>
        </div>
      </div>

      <ModifierSheet
        item={modifierItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAddLine={handleModifierAdd}
      />
    </>
  );
}
