"use client";

import { useState } from "react";

import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { SettingsForm, type SettingsField } from "@/features/app-settings/components/settings-form";

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
      <SegmentedTabs
        aria-label="Provider"
        value={active ?? ""}
        onChange={setActive}
        tabs={tabs.map((t) => ({ key: t.key, label: t.label }))}
      />

      {current && (
        <SettingsForm
          key={current.group}
          group={current.group}
          title={current.label}
          fields={current.fields}
        />
      )}
    </div>
  );
}
