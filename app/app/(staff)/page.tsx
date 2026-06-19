"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { navItemsForRole, ROLE_LABELS, roleHomePath } from "@/lib/nav";
import { useSession } from "@/hooks/use-session";

export default function StaffOverviewPage() {
  const user = useSession((s) => s.user!);
  const activeBranch = useSession((s) => s.activeBranch);
  const items = navItemsForRole(user.role).filter((i) => i.href !== "/app");
  const home = roleHomePath(user.role);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <StatusPill tone="brand">{ROLE_LABELS[user.role]}</StatusPill>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {activeBranch.name} · Jump into your workspace below.
      </p>

      {home !== "/app" && (
        <Button asChild className="mt-6" size="lg">
          <Link href={home}>
            Open {ROLE_LABELS[user.role]} dashboard <ArrowRight className="size-4" />
          </Link>
        </Button>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const live = [
            "/app/kitchen",
            "/app/waiter",
            "/app/manager",
            "/app/owner",
            "/app/menu",
            "/app/staff",
            "/app/settings",
          ].includes(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-elevated)]">
                <CardContent className="flex items-start gap-4 p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-display font-semibold text-ink">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.section}
                      {live ? " · live" : " · coming soon"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
