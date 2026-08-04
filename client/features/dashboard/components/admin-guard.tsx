"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useSession } from "@/hooks/use-session";
import { roleHomePath } from "@/lib/nav";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const role = useSession((s) => s.user?.role);

  if (role !== "admin") {
    return (
      <EmptyState
        icon={Shield}
        title="Admin access only"
        description="This section is restricted to admins."
        action={
          <Button asChild variant="outline">
            <Link href={roleHomePath(role ?? "admin")}>Back to dashboard</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
