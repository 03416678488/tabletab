"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LayoutDashboard, RefreshCw, ServerCrash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { isStaffRole } from "@/lib/roles";

/** Runtime error boundary for the staff dashboard (rendered inside the shell). */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ role?: string }>();
  const sessionRole = useSession((s) => s.user?.role);
  const role = sessionRole ?? (isStaffRole(params.role ?? "") ? params.role : undefined);
  const home = role ? `/${role}/dashboard` : "/login";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <ServerCrash className="size-8" aria-hidden />
      </div>
      <h1 className="font-display text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        An unexpected error occurred while loading this page. You can retry, or go back to your
        dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/70">Reference: {error.digest}</p>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={home}>
            <LayoutDashboard className="size-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
