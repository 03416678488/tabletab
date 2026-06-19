"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useSession } from "@/hooks/use-session";

export function OwnerGuard({ children }: { children: React.ReactNode }) {
  const role = useSession((s) => s.user?.role);

  if (role !== "owner") {
    return (
      <EmptyState
        icon={Shield}
        title="Owner access only"
        description="This section is restricted to account owners."
        action={
          <Button asChild variant="outline">
            <Link href="/app">Back to overview</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
