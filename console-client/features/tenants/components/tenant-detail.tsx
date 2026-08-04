"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  DatabaseZap,
  Globe,
  Loader2,
  Power,
  Save,
  Server,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { toast } from "@/hooks/use-toast";
import { tenantService } from "@/features/tenants/services/tenant.service";
import { type Plan, planService } from "@/features/plans/plan.service";
import { billingService } from "@/features/billing/billing.service";
import { DomainsManager } from "@/features/domains/components/domains-manager";
import type { Tenant, TenantStatus } from "@/features/tenants/types/tenant";

const STATUS_TONE: Record<TenantStatus, "amber" | "green" | "red"> = {
  provisioning: "amber",
  active: "green",
  suspended: "red",
};

const SUB_TONE: Record<string, "green" | "amber" | "red" | "neutral"> = {
  active: "green",
  trialing: "green",
  past_due: "amber",
  incomplete: "amber",
  canceled: "red",
  unpaid: "red",
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** A read-only key/value line used throughout the detail cards. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, hint }: { icon: typeof Globe; title: string; hint?: string }) {
  return (
    <div className="mb-1">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
        <Icon className="size-4 text-brand" /> {title}
      </h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TenantDetail({ id }: { id: string }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Editable plan state — seeded from the tenant, saved on demand. (Domains are
  // managed through the verification workflow below, not free-text here.)
  const [plan, setPlan] = useState("trial");

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<"status" | "provision" | "checkout" | "delete" | null>(null);

  const hydrate = (t: Tenant) => {
    setTenant(t);
    setPlan(t.plan);
  };

  useEffect(() => {
    tenantService
      .get(id)
      .then(hydrate)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    planService.list().then(setPlans).catch(() => setPlans([]));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !tenant) {
    return (
      <div className="space-y-4">
        <Link href="/tenants" className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline">
          <ArrowLeft className="size-4" /> Back to tenants
        </Link>
        <Card className="p-8 text-center text-muted-foreground">This tenant could not be found.</Card>
      </div>
    );
  }

  const dirty = plan !== tenant.plan;

  const save = async () => {
    setSaving(true);
    try {
      hydrate(await tenantService.update(tenant.id, { plan }));
      toast("Changes saved", { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save changes", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const provision = async () => {
    setBusy("provision");
    try {
      hydrate(await tenantService.provision(tenant.id));
      toast("Database ready", { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Provisioning failed", { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const toggleStatus = async () => {
    const next: TenantStatus = tenant.status === "suspended" ? "active" : "suspended";
    setBusy("status");
    try {
      hydrate(await tenantService.setStatus(tenant.id, next));
    } catch {
      toast("Couldn't update status", { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const checkout = async () => {
    if (plan === "trial") {
      toast("Free plan — set a paid plan to subscribe", { tone: "info" });
      return;
    }
    setBusy("checkout");
    try {
      const { url } = await billingService.checkout(tenant.id, tenant.plan);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't start checkout", { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const typed = prompt(
      `This permanently deletes "${tenant.name}" AND drops its database — this cannot be undone.\n\nType the handle "${tenant.slug}" to confirm:`,
    );
    if (typed === null) return;
    if (typed !== tenant.slug) {
      toast("Handle didn't match — deletion cancelled", { tone: "error" });
      return;
    }
    setBusy("delete");
    try {
      await tenantService.remove(tenant.id, typed);
      toast(`${tenant.name} deleted`, { tone: "success" });
      router.push("/tenants");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete tenant", { tone: "error" });
      setBusy(null);
    }
  };

  const planOptions = plans.length
    ? plans.map((p) => ({
        value: p.id,
        label: p.label,
        sublabel: p.priceCents > 0 ? `$${(p.priceCents / 100).toFixed(0)}/mo` : "Free",
      }))
    : [{ value: tenant.plan, label: tenant.plan }];

  const subTone = tenant.subscriptionStatus
    ? SUB_TONE[tenant.subscriptionStatus] ?? "neutral"
    : "neutral";

  return (
    <div className="space-y-5">
      <Link
        href="/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
      >
        <ArrowLeft className="size-4" /> Back to tenants
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{tenant.name}</h1>
            <StatusPill tone={STATUS_TONE[tenant.status]} className="capitalize">
              {tenant.status}
            </StatusPill>
            <StatusPill tone="brand" dot={false} className="capitalize">
              {tenant.plan}
            </StatusPill>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{tenant.slug}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tenant.status === "provisioning" && (
            <Button size="sm" variant="outline" onClick={provision} disabled={busy !== null}>
              {busy === "provision" ? <Loader2 className="size-4 animate-spin" /> : <DatabaseZap className="size-4" />}
              Provision
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleStatus}
            disabled={busy !== null || tenant.status === "provisioning"}
          >
            {busy === "status" ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
            {tenant.status === "suspended" ? "Reactivate" : "Suspend"}
          </Button>
          <Button size="sm" variant="destructive" onClick={remove} disabled={busy !== null}>
            {busy === "delete" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Infrastructure */}
        <Card className="p-5">
          <SectionTitle icon={Server} title="Infrastructure" />
          <div className="mt-2">
            <Row label="Subdomain">
              <span className="font-mono">{tenant.subdomain}.yourapp.com</span>
            </Row>
            <Row label="Storefront domain">
              <span className="font-mono">{tenant.storefrontDomain ?? "—"}</span>
            </Row>
            <Row label="Admin domain">
              <span className="font-mono">{tenant.adminDomain ?? "—"}</span>
            </Row>
            <Row label="Database">
              <span className="font-mono">{tenant.dbName}</span>
            </Row>
            <Row label="DB host">
              <span className="font-mono">{tenant.dbHost ?? "platform default"}</span>
            </Row>
            <Row label="Created">{fmtDate(tenant.createdAt)}</Row>
            <Row label="Updated">{fmtDate(tenant.updatedAt)}</Row>
          </div>
        </Card>

        {/* Billing */}
        <Card className="p-5">
          <SectionTitle icon={CreditCard} title="Billing" />
          <div className="mt-2">
            <Row label="Plan">
              <span className="capitalize">{tenant.plan}</span>
            </Row>
            <Row label="Subscription">
              {tenant.subscriptionStatus ? (
                <StatusPill tone={subTone} className="capitalize">
                  {tenant.subscriptionStatus.replace(/_/g, " ")}
                </StatusPill>
              ) : (
                "No subscription"
              )}
            </Row>
            <Row label="Renews / ends">{fmtDate(tenant.currentPeriodEnd)}</Row>
            <Row label="Stripe customer">
              <span className="font-mono text-xs">{tenant.stripeCustomerId ?? "—"}</span>
            </Row>
            <Row label="Stripe subscription">
              <span className="font-mono text-xs">{tenant.stripeSubscriptionId ?? "—"}</span>
            </Row>
          </div>
          <Button size="sm" variant="outline" className="mt-3" onClick={checkout} disabled={busy !== null}>
            {busy === "checkout" ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            Start checkout
          </Button>
        </Card>
      </div>

      {/* Plan */}
      <Card className="p-5">
        <SectionTitle icon={Sparkles} title="Plan" hint="The tenant's subscription tier." />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="w-56 space-y-1.5">
            <Label>Plan</Label>
            <Dropdown value={plan} onChange={setPlan} options={planOptions} />
          </div>
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save
          </Button>
        </div>
      </Card>

      {/* Custom domains — add + DNS-verify workflow */}
      <Card className="p-5">
        <DomainsManager tenantId={tenant.id} />
      </Card>
    </div>
  );
}
