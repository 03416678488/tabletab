"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useRegister } from "@/features/register/hooks/use-register";
import { registerService } from "@/features/register/services/register.service";

export function CashRegister() {
  const { current, sessions, loading, refetch } = useRegister();
  const session = current.session;
  const summary = current.summary;

  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState("");
  const [counted, setCounted] = useState("");
  const [cashKind, setCashKind] = useState<"cash_in" | "cash_out">("cash_in");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok, { tone: "success" });
      await refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Action failed", { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const openRegister = () =>
    run(async () => {
      await registerService.open({ openingBalance: Number(opening) || 0 });
      setOpening("");
    }, "Register opened");

  const closeRegister = () =>
    run(async () => {
      const res = await registerService.close({ countedBalance: Number(counted) || 0 });
      const v = res.session.variance ?? 0;
      toast(
        v === 0
          ? "Register balanced"
          : `Register closed · ${v > 0 ? "over" : "short"} ${formatMoney(Math.abs(v))}`,
        { tone: v === 0 ? "success" : "error" },
      );
      setCounted("");
    }, "Register closed");

  const addCash = () =>
    run(async () => {
      await registerService.cash({
        type: cashKind,
        amount: Number(cashAmount) || 0,
        note: cashNote || undefined,
      });
      setCashAmount("");
      setCashNote("");
    }, "Cash movement recorded");

  return (
    <div className="w-full">
      <div>
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
          <Wallet className="size-5 text-brand" /> Cash Register
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Open a shift, track cash, and reconcile the drawer at close.
        </p>
      </div>

      {loading ? (
        <Skeleton className="mt-5 h-64 w-full rounded-2xl" />
      ) : !session ? (
        /* No open session — open one */
        <Card className="mt-5 max-w-md p-5">
          <h2 className="font-semibold text-ink">Open register</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Enter the starting cash float in the drawer.
          </p>
          <div className="mt-4 space-y-1.5">
            <Label>Opening balance</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <Button className="mt-4" disabled={busy} onClick={openRegister}>
            {busy && <Loader2 className="size-4 animate-spin" />} Open register
          </Button>
        </Card>
      ) : (
        /* Open session — summary + cash + close */
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Current shift</h2>
              <StatusPill tone="green">Open</StatusPill>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Opened {new Date(session.openedAt).toLocaleString()}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Opening" value={formatMoney(session.openingBalance)} />
              <Stat label="Cash sales" value={formatMoney(summary?.cashSales ?? 0)} />
              <Stat label="Cash in" value={formatMoney(summary?.cashIn ?? 0)} />
              <Stat label="Cash out" value={formatMoney(summary?.cashOut ?? 0)} />
              <Stat label="Card / MFS" value={formatMoney((summary?.cardSales ?? 0) + (summary?.mfsSales ?? 0))} />
              <Stat label="Expected cash" value={formatMoney(summary?.expectedCash ?? 0)} tone="brand" />
            </div>

            {/* Cash in / out */}
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm font-medium text-ink">Cash in / out</p>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <div className="flex rounded-lg border border-border p-0.5">
                  {(["cash_in", "cash_out"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setCashKind(k)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        cashKind === k ? "bg-brand text-white" : "text-muted-foreground",
                      )}
                    >
                      {k === "cash_in" ? "In" : "Out"}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Amount"
                  className="h-9 w-28"
                />
                <Input
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  placeholder="Reason (optional)"
                  className="h-9 min-w-0 flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy || !cashAmount}
                  onClick={addCash}
                >
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {/* Close register */}
          <Card className="h-fit p-5">
            <h2 className="font-semibold text-ink">Close register</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Count the drawer and enter the total to reconcile.
            </p>
            <div className="mt-4 space-y-1.5">
              <Label>Counted cash</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {counted !== "" && summary && (
              <p className="mt-2 text-sm text-muted-foreground">
                Expected {formatMoney(summary.expectedCash)} ·{" "}
                <span
                  className={cn(
                    "font-medium",
                    Number(counted) - summary.expectedCash === 0
                      ? "text-ink"
                      : Number(counted) - summary.expectedCash > 0
                        ? "text-emerald-600"
                        : "text-red-600",
                  )}
                >
                  {Number(counted) - summary.expectedCash >= 0 ? "Over " : "Short "}
                  {formatMoney(Math.abs(Number(counted) - summary.expectedCash))}
                </span>
              </p>
            )}
            <Button
              variant="destructive"
              className="mt-4 w-full"
              disabled={busy || counted === ""}
              onClick={closeRegister}
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Close register
            </Button>
          </Card>
        </div>
      )}

      {/* Past sessions */}
      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Shift history</h2>
      <Card className="mt-3 overflow-hidden p-0">
        {sessions.filter((s) => s.status === "closed").length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No closed shifts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Opened</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Opening</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Counted</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions
                  .filter((s) => s.status === "closed")
                  .map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(s.openedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.closedAt ? new Date(s.closedAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>{formatMoney(s.openingBalance)}</TableCell>
                      <TableCell>{formatMoney(s.expectedBalance ?? 0)}</TableCell>
                      <TableCell>{formatMoney(s.closingCountedBalance ?? 0)}</TableCell>
                      <TableCell>
                        <StatusPill tone={(s.variance ?? 0) === 0 ? "green" : "red"}>
                          {(s.variance ?? 0) >= 0 ? "+" : "−"}
                          {formatMoney(Math.abs(s.variance ?? 0))}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "brand";
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-semibold", tone === "brand" ? "text-brand" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}
