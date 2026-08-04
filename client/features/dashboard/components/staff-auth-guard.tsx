"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ role?: string }>();
  const status = useSession((s) => s.status);
  const role = useSession((s) => s.user?.role);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    // Keep the URL role segment in sync with the signed-in user's role:
    // e.g. an admin who lands on /manager/... is bounced to /admin/...
    if (status === "authenticated" && role && params.role && params.role !== role) {
      const rest = pathname.split("/").slice(2).join("/");
      router.replace(`/${role}${rest ? `/${rest}` : "/dashboard"}`);
    }
  }, [status, role, params.role, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-subtle">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  if (status !== "authenticated") return null;
  // Avoid flashing the wrong role's shell during the redirect above.
  if (role && params.role && params.role !== role) return null;

  return <>{children}</>;
}
