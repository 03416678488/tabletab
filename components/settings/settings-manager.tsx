"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, MapPin, Plus, Printer, Settings2 } from "lucide-react";
import { BrandingSettings } from "@/components/settings/branding-settings";
import { BuffetSettings } from "@/components/settings/buffet-settings";
import { MenuDisplaySettings } from "@/components/settings/menu-display-settings";
import { ReservationSettings } from "@/components/settings/reservation-settings";
import { BranchDialog } from "@/components/settings/branch-dialog";
import { TableQrCard } from "@/components/settings/table-qr-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { useSettingsStore } from "@/hooks/use-settings-store";
import { toast } from "@/hooks/use-toast";
import { groupTablesByFloor } from "@/lib/table-utils";
import type { Branch } from "@/lib/types";

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
];

export function SettingsManager() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const tenant = useSettingsStore((s) => s.tenant);
  const branches = useSettingsStore((s) => s.branches);
  const updateTenant = useSettingsStore((s) => s.updateTenant);
  const addBranch = useSettingsStore((s) => s.addBranch);
  const updateBranch = useSettingsStore((s) => s.updateBranch);
  const addTable = useSettingsStore((s) => s.addTable);
  const removeTable = useSettingsStore((s) => s.removeTable);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [qrBranchId, setQrBranchId] = useState<string | null>(null);
  const [newTableFloor, setNewTableFloor] = useState("");
  const [newTableSeats, setNewTableSeats] = useState(4);

  const qrBranch = branches.find((b) => b.id === qrBranchId) ?? branches[0] ?? null;

  const openAddBranch = () => {
    setEditingBranch(null);
    setDialogOpen(true);
  };

  const openEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setDialogOpen(true);
  };

  const handleSaveBranch = (input: Parameters<typeof addBranch>[0]) => {
    if (editingBranch) {
      updateBranch(editingBranch.id, input);
      toast("Branch updated", { tone: "success" });
    } else {
      const created = addBranch(input);
      setQrBranchId(created.id);
      toast("Branch created", { tone: "success" });
    }
  };

  const toggleLanguage = (code: string) => {
    const langs = tenant.languages.includes(code)
      ? tenant.languages.filter((l) => l !== code)
      : [...tenant.languages, code];
    if (langs.length === 0) return;
    updateTenant({ languages: langs });
  };

  if (!hydrated) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-muted-foreground">Tenant configuration and branches</p>
      </div>

      {/* Tenant */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Settings2 className="size-5 text-brand" />
          <CardTitle className="font-display text-base">Tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">Business name</Label>
              <Input
                id="tenant-name"
                value={tenant.name}
                onChange={(e) => updateTenant({ name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-tagline">Tagline</Label>
              <Input
                id="tenant-tagline"
                value={tenant.tagline}
                onChange={(e) => updateTenant({ tagline: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="sla">SLA window (minutes)</Label>
              <Input
                id="sla"
                type="number"
                min={1}
                max={60}
                value={tenant.slaWindowMins}
                onChange={(e) =>
                  updateTenant({ slaWindowMins: parseInt(e.target.value, 10) || 5 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={tenant.currency}
                onChange={(e) => updateTenant({ currency: e.target.value })}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax rate (%)</Label>
              <Input
                id="tax"
                type="number"
                min={0}
                step={0.1}
                value={tenant.taxRate}
                onChange={(e) =>
                  updateTenant({ taxRate: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service charge (%)</Label>
              <Input
                id="service"
                type="number"
                min={0}
                step={0.5}
                value={tenant.serviceChargePct}
                onChange={(e) =>
                  updateTenant({ serviceChargePct: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Languages</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => toggleLanguage(lang.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    tenant.languages.includes(lang.id)
                      ? "border-brand bg-brand-tint text-brand-deep"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <BrandingSettings />

      <MenuDisplaySettings />

      <ReservationSettings />

      <BuffetSettings />

      {/* Branches */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Building2 className="size-5 text-brand" />
            Branches
          </h2>
          <Button onClick={openAddBranch}>
            <Plus className="size-4" />
            Add branch
          </Button>
        </div>

        {branches.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No branches"
            description="Add your first location to configure tables and QR codes."
            action={
              <Button onClick={openAddBranch}>
                <Plus className="size-4" />
                Add branch
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {branches.map((b) => (
              <Card key={b.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{b.name}</p>
                      <StatusPill tone={b.isOpen ? "green" : "neutral"} dot={false}>
                        {b.isOpen ? "Open" : "Closed"}
                      </StatusPill>
                      {b.onlineOrderingEnabled && (
                        <StatusPill tone="brand" dot={false}>
                          Online
                        </StatusPill>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {b.address}, {b.city} · {b.tables.length} tables
                    </p>
                    <p className="text-xs text-muted-foreground">{b.openingHours}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditBranch(b)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrBranchId(b.id)}
                    >
                      Tables & QR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {/* Tables & QR */}
      {qrBranch && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Tables & QR codes
              </h2>
              <p className="text-sm text-muted-foreground">{qrBranch.name}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/settings/branches/${qrBranch.id}/qr`} target="_blank">
                  <Printer className="size-4" />
                  Download all / Print
                </Link>
              </Button>
            </div>
          </div>

          {qrBranch.tables.length === 0 ? (
            <EmptyState
              title="No tables yet"
              description="Edit the branch and add floors with table counts, or add a table below."
            />
          ) : (
            Object.entries(groupTablesByFloor(qrBranch.tables)).map(([floor, tables]) => (
              <div key={floor} className="mb-8">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {floor}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {tables.map((t) => (
                    <TableQrCard
                      key={t.id}
                      table={t}
                      onRemove={() => {
                        removeTable(qrBranch.id, t.id);
                        toast("Table removed", { tone: "success" });
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          <Card className="mt-4">
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <div className="min-w-[140px] flex-1 space-y-1">
                <Label htmlFor="add-floor">Add table on floor</Label>
                <Input
                  id="add-floor"
                  placeholder="Ground, Terrace…"
                  value={newTableFloor}
                  onChange={(e) => setNewTableFloor(e.target.value)}
                />
              </div>
              <div className="w-24 space-y-1">
                <Label htmlFor="add-seats">Seats</Label>
                <Input
                  id="add-seats"
                  type="number"
                  min={1}
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(parseInt(e.target.value, 10) || 4)}
                />
              </div>
              <Button
                onClick={() => {
                  if (!newTableFloor.trim()) {
                    toast("Enter a floor name", { tone: "error" });
                    return;
                  }
                  addTable(qrBranch.id, newTableFloor.trim(), newTableSeats);
                  toast("Table added with new QR token", { tone: "success" });
                }}
              >
                <Plus className="size-4" />
                Add table
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      <BranchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={editingBranch}
        onSave={handleSaveBranch}
      />
    </div>
  );
}
