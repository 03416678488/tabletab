"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { canAccessSlug, homePathForRole } from "@/lib/permissions";
import { isStaffRole } from "@/lib/roles";

export function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ role?: string }>();
  const status = useSession((s) => s.status);
  const role = useSession((s) => s.user?.role);

  const slug = pathname.split("/")[2] ?? "dashboard";
  // Client-side mirror of the proxy's authorization: the URL role must match the
  // signed-in user AND the page must be permitted for that role. Defense in depth
  // — the proxy is authoritative, but this prevents any wrong-role flash.
  const roleMismatch = !!role && !!params.role && params.role !== role;
  const forbiddenPage =
    !!role && isStaffRole(role) && !canAccessSlug(role, slug);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status !== "authenticated" || !role) return;
    // Wrong namespace: bounce to the same page under the user's own role (or
    // their dashboard if they can't access it).
    if (roleMismatch) {
      const rest = pathname.split("/").slice(2).join("/");
      router.replace(`/${role}${rest ? `/${rest}` : "/dashboard"}`);
      return;
    }
    // Right namespace but a page this role may not open → their dashboard.
    if (forbiddenPage) {
      router.replace(homePathForRole(role));
    }
  }, [status, role, params.role, pathname, router, roleMismatch, forbiddenPage]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-subtle">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  if (status !== "authenticated") return null;
  // Avoid flashing the wrong role's shell / an unauthorized page during redirect.
  if (roleMismatch || forbiddenPage) return null;

  return <>{children}</>;
}
