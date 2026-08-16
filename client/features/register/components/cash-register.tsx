"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
import { formatDateTime } from "@/lib/datetime";
import { toast } from "@/hooks/use-toast";

import { useScopedBranchId } from "@/features/branch/hooks/use-scoped-branch";
import { useRegister, useRegisterOverview } from "@/features/register/hooks/use-register";
import { registerService } from "@/features/register/services/register.service";

export function CashRegister() {
  // Follow the topbar branch switcher: a branch → operate its drawer;
  // "All branches" (undefined) → read-only cross-branch overview.
  const branchId = useScopedBranchId();

  return (
    <div className="w-full">
      <div>
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
          <Wallet className="size-5 text-brand" /> Cash Register
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {branchId
            ? "Open a shift, track cash, and reconcile the drawer at close."
            : "Live drawer status across all branches — select a branch to open or manage one."}
        </p>
      </div>

      {branchId ? <OperateRegister branchId={branchId} /> : <AllBranchesOverview />}
    </div>
  );
}

/* ---------------------------------------------------- All-branches overview */

function AllBranchesOverview() {
  const { overview, loading, error } = useRegisterOverview();

  return (
    <Card className="mt-5 overflow-hidden p-0">
      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : error || !overview ? (
        <EmptyState
          className="py-12"
          icon={Wallet}
          title="Couldn't load"
          description={error ?? ""}
        />
      ) : overview.rows.length === 0 ? (
        <EmptyState
          className="py-12"
          icon={Wallet}
          title="No branches"
          description="Add a branch to manage its cash drawer."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm">
            <span className="font-semibold text-ink">
              {overview.totals.openDrawers} drawer{overview.totals.openDrawers === 1 ? "" : "s"}{" "}
              open
            </span>
            <span className="text-muted-foreground">
              Total expected cash on hand:{" "}
              <span className="font-semibold text-ink tabular-nums">
                {formatMoney(overview.totals.expectedCash)}
              </span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right">Cash sales</TableHead>
                  <TableHead className="text-right">In / Out</TableHead>
                  <TableHead className="text-right">Expected cash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.rows.map((r) => (
                  <TableRow key={r.branchId}>
                    <TableCell className="font-medium text-ink">{r.branchName}</TableCell>
                    <TableCell>
                      <StatusPill tone={r.status === "open" ? "green" : "neutral"}>
                        {r.status === "open" ? "Open" : "Closed"}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.openingBalance == null ? "—" : formatMoney(r.openingBalance)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.cashSales == null ? "—" : formatMoney(r.cashSales)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.status === "open"
                        ? `${formatMoney(r.cashIn ?? 0)} / ${formatMoney(r.cashOut ?? 0)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-ink">
                      {r.expectedCash == null ? "—" : formatMoney(r.expectedCash)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            A cash drawer is operated one branch at a time. Pick a branch in the top bar to open,
            add cash, or close its drawer.
          </p>
        </>
      )}
    </Card>
  );
}

/* ------------------------------------------------------ Single-branch operate */

function OperateRegister({ branchId }: { branchId: string }) {
  const { current, sessions, loading, refetch } = useRegister(branchId);
  const session = current.session;
  const summary = current.summary;

  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState("");
  const [counted, setCounted] = useState("");
  const [cashKind, setCashKind] = useState<"cash_in" | "cash_out">("cash_in");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await refetch();
    } catch {
    } finally {
      setBusy(false);
    }
  };

  const openRegister = () =>
    run(async () => {
      await registerService.open({ openingBalance: Number(opening) || 0, branchId });
      setOpening("");
    });

  const closeRegister = () =>
    run(async () => {
      const res = await registerService.close({ countedBalance: Number(counted) || 0, branchId });
      const v = res.session.variance ?? 0;
      toast(
        v === 0
          ? "Register balanced"
          : `Register closed · ${v > 0 ? "over" : "short"} ${formatMoney(Math.abs(v))}`,
        { tone: v === 0 ? "success" : "error" },
      );
      setCounted("");
    });

  const addCash = () =>
    run(async () => {
      await registerService.cash({
        type: cashKind,
        amount: Number(cashAmount) || 0,
        branchId,
        note: cashNote || undefined,
      });
      setCashAmount("");
      setCashNote("");
    });

  return (
    <>
      {loading ? (
        <Skeleton className="mt-5 h-64 w-full rounded-2xl" />
      ) : !session ? (
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
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Current shift</h2>
              <StatusPill tone="green">Open</StatusPill>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Opened {formatDateTime(session.openedAt)}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Opening" value={formatMoney(session.openingBalance)} />
              <Stat label="Cash sales" value={formatMoney(summary?.cashSales ?? 0)} />
              <Stat label="Cash in" value={formatMoney(summary?.cashIn ?? 0)} />
              <Stat label="Cash out" value={formatMoney(summary?.cashOut ?? 0)} />
              <Stat
                label="Card / MFS"
                value={formatMoney((summary?.cardSales ?? 0) + (summary?.mfsSales ?? 0))}
              />
              <Stat
                label="Expected cash"
                value={formatMoney(summary?.expectedCash ?? 0)}
                tone="brand"
              />
            </div>

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
                        {formatDateTime(s.openedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.closedAt ? formatDateTime(s.closedAt) : "—"}
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
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-semibold", tone === "brand" ? "text-brand" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}
