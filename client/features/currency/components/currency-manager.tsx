"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useCurrencies } from "@/features/currency/hooks/use-currencies";
import { currencyService } from "@/features/currency/services/currency.service";
import {
  CURRENCY_CATALOG,
  FRANKFURTER_CODES,
} from "@/features/currency/constants/currency-catalog";
import { ExchangeRateSettings } from "@/features/currency/components/exchange-rate-settings";
import { useSettings } from "@/features/app-settings/components/settings-provider";
import { settingsService } from "@/features/app-settings/services/settings.service";
import { useClientPagination } from "@/hooks/use-client-pagination";
import type { Currency } from "@/features/currency/types/currency.types";

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 text-sm text-ink shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30";

export function CurrencyManager() {
  const { currencies, loading, error, refetch } = useCurrencies();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter((c) =>
      `${c.name} ${c.code} ${c.symbol}`.toLowerCase().includes(q),
    );
  }, [currencies, search]);
  const { page, setPage, perPage, setPerPage, totalPages, totalItems, pageItems } =
    useClientPagination(filtered);
  const { get, refresh } = useSettings();
  const defaultCode = (get("site", "default_currency") || "").toUpperCase();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [saving, setSaving] = useState(false);

  // Create-mode picks a catalog currency; edit-mode tweaks rate/flags.
  const [pickCode, setPickCode] = useState("");
  const [rate, setRate] = useState("1");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const existingCodes = useMemo(
    () => new Set(currencies.map((c) => c.code.toUpperCase())),
    [currencies],
  );
  const options = useMemo(
    () => CURRENCY_CATALOG.filter((c) => !existingCodes.has(c.code)),
    [existingCodes],
  );

  useEffect(() => {
    if (!open) return;
    setPickCode("");
    setRate(editing ? String(editing.exchangeRate) : "1");
    setAutoUpdate(editing ? editing.autoUpdate : true);
    setIsActive(editing ? editing.isActive : true);
  }, [open, editing]);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (c: Currency) => {
    setEditing(c);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await currencyService.update(editing.id, {
          exchangeRate: Number(rate) || 1,
          autoUpdate,
          isActive,
        });
      } else {
        const pick = CURRENCY_CATALOG.find((c) => c.code === pickCode);
        if (!pick) return;
        await currencyService.create({
          name: pick.name,
          symbol: pick.symbol,
          code: pick.code,
          exchangeRate: Number(rate) || 1,
          autoUpdate,
          isActive,
        });
      }
      toast("Currency saved", { tone: "success" });
      setOpen(false);
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleAuto = async (c: Currency) => {
    try {
      await currencyService.update(c.id, { autoUpdate: !c.autoUpdate });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", { tone: "error" });
    }
  };

  const toggleActive = async (c: Currency) => {
    try {
      await currencyService.update(c.id, { isActive: !c.isActive });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", { tone: "error" });
    }
  };

  const setDefault = async (c: Currency) => {
    try {
      await settingsService.saveGroup("site", { default_currency: c.code });
      await refresh(); // re-apply the app-wide currency symbol/position/decimals
      toast(`${c.code} set as default currency`, { tone: "success" });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to set default", { tone: "error" });
    }
  };

  const confirm = useConfirm();

  const remove = async (c: Currency) => {
    if (!(await confirm({ title: `Delete ${c.name}?`, confirmLabel: "Delete" }))) return;
    try {
      await currencyService.remove(c.id);
      toast("Currency deleted", { tone: "success" });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", { tone: "error" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Exchange-rate provider / frequency / base + Sync now */}
      <ExchangeRateSettings onChange={refetch} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Currencies</h2>
        <div className="flex items-center gap-2">
          <div className="relative sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currencies…"
              className="h-9 pl-9"
              aria-label="Search currencies"
            />
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" /> Add Currency
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <TableRowsSkeleton />
        ) : error ? (
          <EmptyState className="py-10" icon={Coins} title="Couldn't load" description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="py-10"
            icon={Coins}
            title={search.trim() ? "No matches" : "No currencies"}
            description={search.trim() ? "Try a different search." : "Add one to get started."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Exchange Rate</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Auto</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((c) => {
                const supported = FRANKFURTER_CODES.has(c.code.toUpperCase());
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.symbol}</TableCell>
                    <TableCell className="text-muted-foreground">{c.code}</TableCell>
                    <TableCell className="text-muted-foreground">{c.exchangeRate}</TableCell>
                    <TableCell>
                      <input
                        type="radio"
                        name="default-currency"
                        className="size-4 accent-brand"
                        aria-label={`Set ${c.code} as default`}
                        checked={defaultCode === c.code.toUpperCase()}
                        onChange={() => setDefault(c)}
                      />
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => toggleActive(c)} aria-label="Toggle active">
                        <StatusPill tone={c.isActive ? "green" : "neutral"}>
                          {c.isActive ? "Active" : "Inactive"}
                        </StatusPill>
                      </button>
                    </TableCell>
                    <TableCell>
                      <label
                        className="inline-flex items-center gap-2"
                        title={
                          supported
                            ? "Auto-update daily from Frankfurter"
                            : "Not on Frankfurter — will be skipped by sync"
                        }
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-brand disabled:opacity-40"
                          checked={c.autoUpdate}
                          disabled={!supported}
                          onChange={() => toggleAuto(c)}
                        />
                        {!supported && (
                          <StatusPill tone="neutral" dot={false} className="text-[10px]">
                            manual
                          </StatusPill>
                        )}
                      </label>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(c)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(c)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {!loading && !error && filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add currency"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editing ? (
              <Field label="Currency">
                <Input value={`${editing.name} (${editing.code})`} disabled />
              </Field>
            ) : (
              <Field label="Currency">
                <select
                  className={SELECT_CLASS}
                  value={pickCode}
                  onChange={(e) => setPickCode(e.target.value)}
                >
                  <option value="">— Select a currency —</option>
                  {options.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code}) {c.symbol}
                      {FRANKFURTER_CODES.has(c.code) ? "" : " · manual"}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Exchange Rate">
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Field>

            <div className="flex items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-brand"
                  checked={autoUpdate}
                  onChange={(e) => setAutoUpdate(e.target.checked)}
                />
                Auto-update rate
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-brand"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving || (!editing && !pickCode)} onClick={save}>
              {saving && <Loader2 className="size-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
