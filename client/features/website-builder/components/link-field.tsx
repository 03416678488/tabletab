"use client";

import { type Control, Controller, type FieldValues, type Path } from "react-hook-form";
import { BadgePercent } from "lucide-react";

import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Field } from "@/features/website-builder/components/form-fields";
import { useActivePromotions } from "@/features/promotion/hooks/use-active-promotions";

/**
 * A link/href input with a "link to a promotion" quick-pick. The field stays
 * free text (custom URLs, `/menu/{id}`, etc.), but picking a live promotion
 * fills it with `/promotion/{slug}` — no hand-typing, no dead links.
 */
export function LinkField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "/path or https://…",
}: {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
}) {
  const { promotions } = useActivePromotions();
  return (
    <Field label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = (field.value as string) ?? "";
          return (
            <div className="space-y-1.5">
              <Input
                value={value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={placeholder}
                className="h-9"
              />
              {promotions.length > 0 && (
                <Dropdown
                  value={
                    promotions.some((p) => `/promotion/${p.slug}` === value)
                      ? value.replace("/promotion/", "")
                      : ""
                  }
                  onChange={(slug) => field.onChange(`/promotion/${slug}`)}
                  options={promotions.map((p) => ({
                    value: p.slug,
                    label: `${p.title}`,
                  }))}
                  placeholder="🎟 Link to a promotion…"
                />
              )}
            </div>
          );
        }}
      />
    </Field>
  );
}

/** Icon re-export so callers can badge a promotion link if they want. */
export { BadgePercent as PromotionIcon };
