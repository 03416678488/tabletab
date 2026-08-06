"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  isChimeMuted,
  playNewOrderChime,
  setChimeMuted,
} from "@/features/order/lib/chime";

/**
 * Mute/unmute toggle for the new-order chime. The preference is shared across
 * boards (localStorage). Unmuting plays a preview so it also counts as the user
 * gesture that unlocks audio.
 */
export function SoundToggle({
  className,
  variant = "light",
}: {
  className?: string;
  /** "dark" fits the OSS board's dark background. */
  variant?: "light" | "dark";
}) {
  const [muted, setMuted] = useState(false);

  // Read the persisted preference on mount (avoids a hydration mismatch).
  useEffect(() => setMuted(isChimeMuted()), []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setChimeMuted(next);
    if (!next) playNewOrderChime(); // preview + unlock on unmute
  };

  const dark = variant === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? "Unmute new-order chime" : "Mute new-order chime"}
      title={muted ? "Sound off" : "Sound on"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl border shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dark
          ? "border-white/15 bg-white/10 text-white hover:bg-white/20"
          : "border-border bg-white text-ink hover:bg-secondary",
        className,
      )}
    >
      {muted ? (
        <VolumeX className={cn("size-5", dark ? "text-white/50" : "text-muted-foreground")} />
      ) : (
        <Volume2 className={cn("size-5", dark ? "text-emerald-300" : "text-brand")} />
      )}
    </button>
  );
}
