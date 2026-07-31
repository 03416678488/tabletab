"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";

export function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useSession((s) => s.status);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status !== "authenticated") return null;

  return <>{children}</>;
}
