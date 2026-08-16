"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Globe, Home, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { ApiError } from "@/lib/httpClient";
import { createPageSchema, type GeneralForm } from "@/features/website-builder/schemas/blocks";
import {
  type PageSummary,
  websiteService,
} from "@/features/website-builder/services/website.service";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function PagesList() {
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const role = params.role;

  const [pages, setPages] = useState<PageSummary[] | null>(null);
  const [open, setOpen] = useState(false);

  const load = () =>
    websiteService
      .list()
      .then(setPages)
      .catch(() => setPages([]));
  useEffect(() => {
    load();
  }, []);

  const goto = (slug: string) => router.push(`/${role}/website-settings/${slug}`);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
            <Globe className="size-5 text-brand" /> Website Pages
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create and manage the pages of your storefront website.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Create page
        </Button>
      </div>

      <div className="mt-5">
        {pages === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              className="py-14"
              icon={FileText}
              title="No pages yet"
              description="Create your first page to start building."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {pages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goto(p.slug)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-brand/40 hover:bg-brand-tint/20"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                  {p.isHome ? <Home className="size-5" /> : <FileText className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
                    {p.title}
                    {p.isHome && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Home
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">/{p.slug}</p>
                </div>
                <StatusPill tone={p.published ? "green" : "neutral"}>
                  {p.published ? "Published" : "Draft"}
                </StatusPill>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreatePageDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(slug) => {
          setOpen(false);
          goto(slug);
        }}
      />
    </div>
  );
}

function CreatePageDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (slug: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GeneralForm>({
    resolver: zodResolver(createPageSchema),
    defaultValues: { title: "", slug: "" },
  });

  // Auto-fill the slug from the title until the user edits the slug directly.
  const [slugEdited, setSlugEdited] = useState(false);
  const title = watch("title");
  useEffect(() => {
    if (!slugEdited) setValue("slug", slugify(title || ""));
  }, [title, slugEdited, setValue]);

  useEffect(() => {
    if (!open) {
      reset({ title: "", slug: "" });
      setSlugEdited(false);
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const page = await websiteService.create(data.title, data.slug);
      onCreated(page.slug);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Couldn't create the page";
      setError("slug", { type: "server", message: msg });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create page</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input {...register("title")} placeholder="e.g. About us" autoFocus />
            {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL slug</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                {...register("slug", { onChange: () => setSlugEdited(true) })}
                placeholder="about-us"
              />
            </div>
            {errors.slug && <p className="text-xs text-rose-600">{errors.slug.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
