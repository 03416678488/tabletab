"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";

import { useLanguages } from "@/features/language/hooks/use-languages";
import {
  translationService,
  type TranslationItem,
} from "@/features/i18n/translation-service";

interface TranslationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: string;
  entityId: string | number;
  /** Translatable fields, e.g. ["name"]. */
  fields: string[];
  title?: string;
}

/** Edit a record's translations across all active languages (except the default). */
export function TranslationDialog({
  open,
  onOpenChange,
  entity,
  entityId,
  fields,
  title,
}: TranslationDialogProps) {
  const { languages } = useLanguages();
  const targets = languages.filter((l) => l.isActive && !l.isDefault);

  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    translationService
      .getFor(entity, entityId)
      .then((data) => {
        const flat: Record<string, string> = {};
        for (const field of fields) {
          for (const l of targets) {
            flat[`${field}.${l.code}`] = data[field]?.[l.code] ?? "";
          }
        }
        setValues(flat);
      })
      .catch(() => setValues({}))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entity, entityId]);

  const save = async () => {
    const items: TranslationItem[] = [];
    for (const field of fields) {
      for (const l of targets) {
        items.push({ field, locale: l.code, value: values[`${field}.${l.code}`] ?? "" });
      }
    }
    setSaving(true);
    try {
      await translationService.save(entity, entityId, items);
      toast("Translations saved", { tone: "success" });
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? "Translations"}</DialogTitle>
          <DialogDescription>
            Provide translations for each active language. Blank keeps the default.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : targets.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No non-default active languages. Add one under Languages.
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-4 overflow-y-auto">
            {fields.map((field) => (
              <div key={field} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {field}
                </p>
                {targets.map((l) => (
                  <div key={l.code} className="space-y-1">
                    <Label className="text-xs">{l.name}</Label>
                    <Input
                      value={values[`${field}.${l.code}`] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [`${field}.${l.code}`]: e.target.value }))
                      }
                      dir={l.code === "ar" ? "rtl" : "ltr"}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving || loading || targets.length === 0} onClick={save}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
