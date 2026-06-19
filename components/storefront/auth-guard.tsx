"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerSession } from "@/hooks/use-customer-session";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useCustomerSession((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useCustomerSession.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useCustomerSession.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  if (!hydrated) {
    return (
      fallback ?? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      )
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
