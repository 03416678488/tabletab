"use client";

import { useState } from "react";
import { Megaphone, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { TableRowsSkeleton } from "@/components/ui/table-rows-skeleton";
import { StatusPill } from "@/components/ui/status-pill";
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

import { usePaginatedCampaigns } from "@/features/campaign/hooks/use-paginated-campaigns";
import { campaignService } from "@/features/campaign/services/campaign.service";
import { CampaignFormDialog } from "@/features/campaign/components/campaign-form-dialog";
import { WhatsappConfigCard } from "@/features/campaign/components/whatsapp-config-card";
import type { Campaign, CampaignStatus } from "@/features/campaign/types/campaign.types";

type Tone = "green" | "amber" | "red" | "neutral" | "blue";

const STATUS_META: Record<CampaignStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "blue" },
  sending: { label: "Sending", tone: "amber" },
  sent: { label: "Sent", tone: "green" },
  failed: { label: "Failed", tone: "red" },
};

export function CampaignsManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { campaigns, loading, error, page, perPage, setPerPage, totalPages, totalItems, goToPage, refetch } =
    usePaginatedCampaigns({ search });
  const confirm = useConfirm();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Campaign) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const remove = async (c: Campaign) => {
    if (!(await confirm({ title: `Delete "${c.name}"?`, confirmLabel: "Delete" }))) return;
    try {
      await campaignService.remove(c.id);
      toast("Campaign deleted", { tone: "success" });
      if (campaigns.length === 1 && page > 1) goToPage(page - 1);
      else refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete", { tone: "error" });
    }
  };

  const send = async (c: Campaign) => {
    const ok = await confirm({
      title: `Send "${c.name}" now?`,
      description: "This messages every customer with a phone number.",
      confirmLabel: "Send",
    });
    if (!ok) return;
    setSendingId(c.id);
    try {
      const result = await campaignService.send(c.id);
      toast(
        `${result.simulated ? "Simulated: " : ""}sent ${result.sentCount}/${result.totalRecipients}` +
          (result.failedCount ? ` · ${result.failedCount} failed` : ""),
        { tone: result.failedCount && !result.sentCount ? "error" : "success" },
      );
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Send failed", { tone: "error" });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Campaigns</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          WhatsApp broadcasts to your customers — attach a promotion to drive orders.
        </p>
      </div>

      <WhatsappConfigCard />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns…"
              className="h-9 pl-9"
              aria-label="Search campaigns"
            />
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4" /> New campaign
          </Button>
        </div>

        <Card className="mt-4 overflow-hidden p-0">
          {loading ? (
            <TableRowsSkeleton />
          ) : error ? (
            <EmptyState
              className="py-12"
              icon={Megaphone}
              title="Couldn't load campaigns"
              description={error}
              action={
                <Button variant="outline" onClick={refetch}>
                  Retry
                </Button>
              }
            />
          ) : campaigns.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={Megaphone}
              title={search ? "No matches" : "No campaigns yet"}
              description={search ? "Try a different search." : "Create your first WhatsApp campaign."}
              action={
                search ? undefined : (
                  <Button onClick={openCreate}>
                    <Plus className="size-4" /> New campaign
                  </Button>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const meta = STATUS_META[c.status];
                  const done = c.status === "sent" || c.status === "failed";
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium text-ink">{c.name}</div>
                        <div className="line-clamp-1 max-w-xs text-xs text-muted-foreground">
                          {c.messageType === "template"
                            ? `Template · ${c.templateName || "—"}`
                            : c.body || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                        {c.simulated && done && (
                          <span className="ml-1 text-[10px] text-muted-foreground">(sim)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {done ? `${c.sentCount}/${c.totalRecipients}` : "—"}
                        {c.failedCount > 0 && (
                          <span className="text-rose-600"> · {c.failedCount} failed</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => send(c)}
                            disabled={sendingId === c.id}
                          >
                            <Send className="size-4" />
                            {sendingId === c.id ? "Sending…" : "Send"}
                          </Button>
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

        {!loading && !error && campaigns.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage}
          perPage={perPage}
          onPerPageChange={setPerPage} className="mt-4" />
        )}
      </div>

      <CampaignFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={editing}
        onSaved={refetch}
      />
    </div>
  );
}
