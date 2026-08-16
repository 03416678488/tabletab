"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/httpClient";
import { generalSchema, type GeneralForm } from "@/features/website-builder/schemas/blocks";
import {
  type WebsitePage,
  websiteService,
} from "@/features/website-builder/services/website.service";

export function GeneralTab({ page, onChange }: { page: WebsitePage; onChange: () => void }) {
  const router = useRouter();
  const role = useParams<{ role: string }>().role;
  const confirm = useConfirm();
  const isHome = page.slug === "home";
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    defaultValues: { title: page.title, slug: page.slug },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const updated = await websiteService.updateGeneral(page.slug, data);
      if (updated.slug !== page.slug) {
        router.replace(`/${role}/website-settings/${updated.slug}`);
      } else {
        onChange();
      }
    } catch (err) {
      setError("slug", {
        type: "server",
        message: err instanceof ApiError ? err.message : "Couldn't save",
      });
    }
  });

  const del = async () => {
    const ok = await confirm({
      title: `Delete “${page.title}”?`,
      description: "This permanently removes the page from your storefront and can't be undone.",
      confirmLabel: "Delete page",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await websiteService.remove(page.slug);
      router.push(`/${role}/website-settings`);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">Page details</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL slug</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">/</span>
              <Input {...register("slug")} disabled={isHome} />
            </div>
            {isHome ? (
              <p className="text-xs text-muted-foreground">
                The home page URL can&apos;t be changed.
              </p>
            ) : (
              errors.slug && <p className="text-xs text-rose-600">{errors.slug.message}</p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save
          </Button>
        </form>
      </Card>

      {!isHome && (
        <Card className="border-rose-200 p-5">
          <h2 className="text-sm font-semibold text-ink">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting a page is permanent and removes it from your storefront.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={del}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete page
          </Button>
        </Card>
      )}
    </div>
  );
}
