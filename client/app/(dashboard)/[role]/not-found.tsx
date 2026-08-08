"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LayoutDashboard, MapPinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { isStaffRole } from "@/lib/roles";

/** 404 for the staff dashboard — rendered inside the app shell (sidebar/topbar),
 *  with a back link scoped to the signed-in user's role. */
export default function DashboardNotFound() {
  const params = useParams<{ role?: string }>();
  const sessionRole = useSession((s) => s.user?.role);
  const role = sessionRole ?? (isStaffRole(params.role ?? "") ? params.role : undefined);
  const home = role ? `/${role}/dashboard` : "/login";

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-tint text-brand-deep">
        <MapPinOff className="size-8" aria-hidden />
      </div>
      <p className="font-display text-6xl font-bold leading-none text-ink">404</p>
      <h1 className="mt-4 font-display text-xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        This page doesn&apos;t exist, or you don&apos;t have access to it. Check the address or
        head back to your dashboard.
      </p>
      <div className="mt-7">
        <Button asChild size="lg">
          <Link href={home}>
            <LayoutDashboard className="size-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
