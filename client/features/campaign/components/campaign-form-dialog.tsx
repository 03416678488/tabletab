"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { applyApiErrorToForm } from "@/lib/httpClient";
import { useActivePromotions } from "@/features/promotion/hooks/use-active-promotions";
import {
  campaignSchema,
  type CampaignFormValues,
} from "@/features/campaign/schemas/campaign.schema";
import { campaignService } from "@/features/campaign/services/campaign.service";
import type {
  Campaign,
  CreateCampaignInput,
  WhatsappTemplate,
} from "@/features/campaign/types/campaign.types";

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  onSaved: () => void;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDefaults(c: Campaign | null): CampaignFormValues {
  return {
    name: c?.name ?? "",
    messageType: c?.messageType ?? "text",
    body: c?.body ?? "",
    templateName: c?.templateName ?? "",
    templateLanguage: c?.templateLanguage ?? "en_US",
    templateParams: c?.templateParams ?? [],
    promotionId: c?.promotionId ?? "",
    scheduledAt: toDatetimeLocal(c?.scheduledAt ?? null),
  };
}

export function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
  onSaved,
}: CampaignFormDialogProps) {
  const isEdit = !!campaign;
  const { promotions } = useActivePromotions();
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: toDefaults(campaign),
  });

  useEffect(() => {
    if (open) reset(toDefaults(campaign));
  }, [open, campaign, reset]);

  // Load the tenant's approved templates when the dialog opens.
  useEffect(() => {
    if (!open) return;
    campaignService
      .templates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [open]);

  const messageType = watch("messageType");
  const params = (watch("templateParams") ?? []) as string[];

  const pickTemplate = (name: string) => {
    setValue("templateName", name, { shouldDirty: true });
    const t = templates.find((x) => x.name === name);
    if (t) {
      setValue("templateLanguage", t.language, { shouldDirty: true });
      setValue(
        "templateParams",
        Array.from({ length: t.bodyParamCount }, () => ""),
        {
          shouldDirty: true,
        },
      );
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateCampaignInput = {
      name: values.name,
      messageType: values.messageType,
      promotionId: values.promotionId || undefined,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
      ...(values.messageType === "text"
        ? { body: values.body ?? "" }
        : {
            templateName: values.templateName,
            templateLanguage: values.templateLanguage || "en_US",
            templateParams: values.templateParams ?? [],
          }),
    };
    try {
      if (isEdit) {
        await campaignService.update(campaign!.id, payload);
      } else {
        await campaignService.create(payload);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "name", ["name"]);
    }
  });

  const promoOptions = [
    { value: "", label: "No promotion" },
    ...promotions.map((p) => ({ value: p.id, label: `${p.title}${p.code ? ` (${p.code})` : ""}` })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit campaign" : "New campaign"}</DialogTitle>
          <DialogDescription>
            Free text works within a 24-hour window / test number. For marketing blasts, Meta
            requires an approved <span className="font-medium">template</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label required>Campaign name</Label>
            <Input {...register("name")} aria-invalid={!!errors.name} placeholder="Weekend blast" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Message type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["text", "template"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue("messageType", type, { shouldDirty: true })}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                  messageType === type
                    ? "border-brand bg-brand-tint/40 text-brand-deep"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {type === "text" ? "Free text" : "Template"}
              </button>
            ))}
          </div>

          {messageType === "text" ? (
            <div className="space-y-1.5">
              <Label>Message</Label>
              <textarea
                {...register("body")}
                rows={4}
                placeholder="Hi! Enjoy a treat this weekend 🍔"
                className="w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-border p-3">
              {templates.length > 0 ? (
                <div className="space-y-1.5">
                  <Label>Approved template</Label>
                  <Dropdown
                    value={watch("templateName") ?? ""}
                    onChange={pickTemplate}
                    options={templates.map((t) => ({
                      value: t.name,
                      label: `${t.name} · ${t.language} (${t.status})`,
                    }))}
                    placeholder="Pick a template…"
                  />
                </div>
              ) : (
                <p className="rounded-lg bg-subtle/60 px-3 py-2 text-xs text-muted-foreground">
                  No templates loaded (connect WhatsApp to fetch them). You can still enter a
                  template name manually below to test the flow.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Template name</Label>
                  <Input {...register("templateName")} placeholder="order_promo" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Input {...register("templateLanguage")} placeholder="en_US" className="h-9" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>
                    Body parameters ({"{{1}}"}, {"{{2}}"}…)
                  </Label>
                  <button
                    type="button"
                    onClick={() =>
                      setValue("templateParams", [...params, ""], { shouldDirty: true })
                    }
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:underline"
                  >
                    <Plus className="size-3.5" /> Add
                  </button>
                </div>
                {params.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No parameters.</p>
                ) : (
                  <div className="space-y-2">
                    {params.map((_, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-8 shrink-0 text-center text-xs font-medium text-muted-foreground">
                          {`{{${i + 1}}}`}
                        </span>
                        <Input
                          {...register(`templateParams.${i}` as const)}
                          placeholder="value or {code} / {link}"
                          className="h-9"
                        />
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() =>
                            setValue(
                              "templateParams",
                              params.filter((__, j) => j !== i),
                              { shouldDirty: true },
                            )
                          }
                          className="text-muted-foreground hover:text-rose-600"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Use <code>{"{code}"}</code> / <code>{"{link}"}</code> to insert the attached
                  promotion&apos;s code and landing link.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Attach a promotion (optional)</Label>
            <Controller
              control={control}
              name="promotionId"
              render={({ field }) => (
                <Dropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={promoOptions}
                  placeholder="No promotion"
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Schedule (optional)</Label>
            <Input type="datetime-local" {...register("scheduledAt")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
