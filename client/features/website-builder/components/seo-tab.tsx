"use client";

import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ImageField, ToggleField } from "@/features/website-builder/components/form-fields";
import { type PageSeo, seoSchema } from "@/features/website-builder/schemas/blocks";
import { type WebsitePage, websiteService } from "@/features/website-builder/services/website.service";

export function SeoTab({ page, onChange }: { page: WebsitePage; onChange: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<PageSeo>({
    resolver: zodResolver(seoSchema) as Resolver<PageSeo>,
    defaultValues: seoSchema.parse(page.seo ?? {}),
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await websiteService.updateSeo(page.slug, data);
      toast("SEO saved", { tone: "success" });
      onChange();
    } catch {
      toast("Couldn't save SEO", { tone: "error" });
    }
  });

  const metaTitle = watch("metaTitle");
  const metaDescription = watch("metaDescription");

  return (
    <div className="grid max-w-4xl gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-ink">Search engine optimisation</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Meta title</Label>
            <Input {...register("metaTitle")} placeholder={page.title} />
            <p className="text-[11px] text-muted-foreground">
              {(metaTitle?.length ?? 0)} / 60 characters recommended
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Meta description</Label>
            <textarea
              {...register("metaDescription")}
              rows={3}
              placeholder="A short summary shown in search results."
              className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <p className="text-[11px] text-muted-foreground">
              {(metaDescription?.length ?? 0)} / 160 characters recommended
            </p>
          </div>
          <ImageField control={control} name="ogImage" label="Social share image (OG image)" />
          <div className="rounded-xl border border-border p-3">
            <ToggleField control={control} name="noindex" label="Hide from search engines (noindex)" />
          </div>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save
          </Button>
        </form>
      </Card>

      {/* Google-style preview */}
      <Card className="h-fit p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search preview
        </h3>
        <div className="mt-3">
          <p className="truncate text-xs text-emerald-700">yoursite.com/{page.slug}</p>
          <p className="mt-0.5 line-clamp-1 text-base text-[#1a0dab]">
            {metaTitle?.trim() || page.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {metaDescription?.trim() || "Add a meta description to control this snippet."}
          </p>
        </div>
      </Card>
    </div>
  );
}
