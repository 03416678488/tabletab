"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Search, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCustomers } from "@/features/customer/hooks/use-customers";
import { CustomerFormDialog } from "@/features/customer/components/customer-form-dialog";
import type { Customer } from "@/features/customer/types/customer.types";

interface CustomerSelectProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
}

export function CustomerSelect({ value, onChange }: CustomerSelectProps) {
  const { customers, refetch } = useCustomers();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q),
    );
  }, [customers, query]);

  const select = (c: Customer | null) => {
    onChange(c);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-white px-3 text-left text-sm shadow-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <UserRound className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
            {value ? value.name : "Walking Customer"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-elevated)]">
              <div className="relative border-b border-border p-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer…"
                  className="h-9 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                <li>
                  <button
                    type="button"
                    onClick={() => select(null)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <span className="text-muted-foreground">Walking Customer</span>
                    {!value && <Check className="size-4 text-brand" />}
                  </button>
                </li>
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => select(c)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-secondary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {c.name}
                        </span>
                        {(c.phone || c.email) && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {c.phone ?? c.email}
                          </span>
                        )}
                      </span>
                      {value?.id === c.id && <Check className="size-4 shrink-0 text-brand" />}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-3 py-3 text-center text-xs text-muted-foreground">
                    No customers found.
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        aria-label="Add customer"
        onClick={() => setDialogOpen(true)}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition-colors hover:bg-brand-deep"
      >
        <Plus className="size-4" />
      </button>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(c) => {
          refetch();
          select(c);
        }}
      />
    </div>
  );
}
