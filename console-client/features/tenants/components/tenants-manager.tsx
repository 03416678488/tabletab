"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CreditCard, DatabaseZap, Loader2, Plus, Power, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { toast } from "@/hooks/use-toast";
import {
  type CreateTenantForm,
  createTenantSchema,
  slugify,
} from "@/features/tenants/schemas/tenant";
import { tenantService } from "@/features/tenants/services/tenant.service";
import { type Plan, planService } from "@/features/plans/plan.service";
import { billingService } from "@/features/billing/billing.service";
import type { Tenant, TenantStatus } from "@/features/tenants/types/tenant";

const STATUS_TONE: Record<TenantStatus, "amber" | "green" | "red"> = {
  provisioning: "amber",
  active: "green",
  suspended: "red",
};

export function TenantsManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: "", slug: "", plan: "trial" },
  });

  const nameValue = watch("name");
  // Auto-fill the handle from the name until the user edits it directly.
  useEffect(() => {
    if (!dirtyFields.slug) setValue("slug", slugify(nameValue ?? ""));
  }, [nameValue, dirtyFields.slug, setValue]);

  const load = async () => {
    setLoading(true);
    try {
      setTenants(await tenantService.list());
    } catch {
      toast("Couldn't load tenants", { tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    planService.list().then(setPlans).catch(() => setPlans([]));
  }, []);

  const planValue = watch("plan") ?? "trial";

  const onCreate = handleSubmit(async (values) => {
    try {
      const created = await tenantService.create(values);
      toast(
        created.status === "active"
          ? `${values.name} created — database ready`
          : `${values.name} created — provisioning didn't finish, retry from the list`,
        { tone: created.status === "active" ? "success" : "info" },
      );
      setDialogOpen(false);
      reset({ name: "", slug: "", plan: "trial" });
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't create tenant", { tone: "error" });
    }
  });

  const provision = async (t: Tenant) => {
    setBusyId(t.id);
    try {
      const updated = await tenantService.provision(t.id);
      setTenants((list) => list.map((x) => (x.id === t.id ? updated : x)));
      toast(`${t.name} database ready`, { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Provisioning failed", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (t: Tenant) => {
    const next: TenantStatus = t.status === "suspended" ? "active" : "suspended";
    setBusyId(t.id);
    try {
      const updated = await tenantService.setStatus(t.id, next);
      setTenants((list) => list.map((x) => (x.id === t.id ? updated : x)));
    } catch {
      toast("Couldn't update status", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const subscribe = async (t: Tenant) => {
    if (t.plan === "trial") {
      toast("Free plan — set a paid plan to subscribe", { tone: "info" });
      return;
    }
    setBusyId(t.id);
    try {
      const { url } = await billingService.checkout(t.id, t.plan);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't start checkout", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (t: Tenant) => {
    const typed = prompt(
      `This permanently deletes "${t.name}" AND drops its database — this cannot be undone.\n\nType the handle "${t.slug}" to confirm:`,
    );
    if (typed === null) return; // cancelled
    if (typed !== t.slug) {
      toast("Handle didn't match — deletion cancelled", { tone: "error" });
      return;
    }
    setBusyId(t.id);
    try {
      await tenantService.remove(t.id, typed);
      setTenants((list) => list.filter((x) => x.id !== t.id));
      toast(`${t.name} deleted`, { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete tenant", { tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <Building2 className="size-5 text-brand" /> Tenants
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every restaurant on the platform — their domains, plan, and status.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> New tenant
        </Button>
      </div>

      <Card className="mt-5 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <EmptyState
            className="py-14"
            icon={Building2}
            title="No tenants yet"
            description="Create your first restaurant to see it here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Restaurant</th>
                  <th className="px-4 py-3 font-medium">Domains</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/tenants/${t.id}`} className="group">
                        <p className="font-semibold text-ink transition-colors group-hover:text-brand">
                          {t.name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{t.slug}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      <p>{t.storefrontDomain ?? `${t.subdomain}.yourapp.com`}</p>
                      <p>{t.adminDomain ?? `restaurant.${t.subdomain}.yourapp.com`}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{t.plan}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={STATUS_TONE[t.status]} className="capitalize">
                        {t.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {t.status === "provisioning" && (
                          <button
                            type="button"
                            disabled={busyId === t.id}
                            onClick={() => provision(t)}
                            title="Provision database"
                            className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-40"
                          >
                            {busyId === t.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <DatabaseZap className="size-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === t.id}
                          onClick={() => subscribe(t)}
                          title="Start subscription checkout"
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink disabled:opacity-40"
                        >
                          <CreditCard className="size-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === t.id || t.status === "provisioning"}
                          onClick={() => toggleStatus(t)}
                          title={t.status === "suspended" ? "Reactivate" : "Suspend"}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-ink disabled:opacity-40"
                        >
                          {busyId === t.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Power className="size-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === t.id}
                          onClick={() => remove(t)}
                          title="Remove"
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="t-name">Restaurant name</Label>
              <Input id="t-name" placeholder="Acme Bistro" {...register("name")} />
              {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-slug">Handle</Label>
              <Input id="t-slug" placeholder="acme-bistro" className="font-mono" {...register("slug")} />
              <p className="text-xs text-muted-foreground">
                Used for the subdomain and database name.
              </p>
              {errors.slug && <p className="text-xs text-rose-600">{errors.slug.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Plan</Label>
              <Dropdown
                value={planValue}
                onChange={(v) => setValue("plan", v, { shouldDirty: true })}
                options={
                  plans.length
                    ? plans.map((p) => ({
                        value: p.id,
                        label: p.label,
                        sublabel:
                          p.priceCents > 0 ? `$${(p.priceCents / 100).toFixed(0)}/mo` : "Free",
                      }))
                    : [{ value: "trial", label: "Trial" }]
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
