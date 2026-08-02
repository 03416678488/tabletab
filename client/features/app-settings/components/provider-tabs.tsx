"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  SettingsForm,
  type SettingsField,
} from "@/features/app-settings/components/settings-form";

export interface ProviderTab {
  key: string;
  label: string;
  /** Settings group this provider persists to, e.g. "sms_twilio". */
  group: string;
  fields: SettingsField[];
}

/** Tabbed provider configs (SMS / Payment / Social Login), each a settings group. */
export function ProviderTabs({ tabs }: { tabs: ProviderTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
              active === t.key
                ? "border-brand bg-brand text-white"
                : "border-border bg-white text-muted-foreground hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {current && (
        <SettingsForm
          key={current.group}
          group={current.group}
          title={current.label}
          fields={[
            ...current.fields,
            {
              key: "status",
              label: "Status",
              type: "toggle",
            },
          ]}
        />
      )}
    </div>
  );
}
