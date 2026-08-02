"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROLE_LABELS, hrefFor } from "@/lib/nav";
import { useSession } from "@/hooks/use-session";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileMenu() {
  const user = useSession((s) => s.user!);
  const logout = useSession((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Avatar = user.avatarUrl ? (
    <Image
      src={user.avatarUrl}
      alt=""
      width={36}
      height={36}
      className="size-9 rounded-full border border-border object-cover"
      unoptimized
    />
  ) : (
    <span className="flex size-9 items-center justify-center rounded-full border border-border bg-brand-tint text-xs font-semibold text-brand-deep">
      {initials(user.name)}
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2.5 rounded-xl px-1 py-1 pr-2 outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-secondary",
        )}
      >
        {Avatar}
        <span className="hidden flex-col text-left leading-tight lg:flex">
          <span className="text-sm font-semibold text-ink">{user.name}</span>
          <span className="text-xs text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            {Avatar}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="p-1.5">
            <Link
              href={hrefFor(user.role, "settings")}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-secondary hover:text-ink"
            >
              <Settings className="size-4 text-slate-400" /> Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
