"use client";

import { useMemo } from "react";

import { Dropdown } from "@/components/ui/dropdown";
import { useSettings } from "@/features/app-settings/components/settings-provider";

const pad = (n: number) => String(n).padStart(2, "0");

/** Format a 24h "HH:mm" value for display — 12-hour ("9:00 AM") or 24-hour. */
function formatTime(hhmm: string, is12h: boolean): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  if (!is12h) return `${pad(h)}:${pad(m)}`;
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${period}`;
}

interface TimeSelectProps {
  /** 24-hour "HH:mm". */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Minutes between options (default 15). */
  step?: number;
  "aria-label"?: string;
}

/**
 * Searchable time dropdown — a nicer replacement for the native `<input type="time">`.
 * Values stay 24-hour "HH:mm"; labels follow the tenant's System → Time Format
 * setting (12h "9:00 AM" or 24h "09:00").
 */
export function TimeSelect({
  value,
  onChange,
  disabled,
  className,
  step = 15,
  "aria-label": ariaLabel,
}: TimeSelectProps) {
  const { get } = useSettings();
  const is12h = (get("site", "time_format") || "hh:mm A") !== "HH:mm";

  const options = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (let mins = 0; mins < 24 * 60; mins += step) {
      const v = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
      out.push({ value: v, label: formatTime(v, is12h) });
    }
    // Keep an off-grid saved value (e.g. 09:05) visible.
    if (value && !out.some((o) => o.value === value)) {
      out.push({ value, label: formatTime(value, is12h) });
      out.sort((a, b) => a.value.localeCompare(b.value));
    }
    return out;
  }, [step, is12h, value]);

  return (
    <Dropdown
      aria-label={ariaLabel}
      searchable
      disabled={disabled}
      className={className}
      placeholder="--:--"
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}
