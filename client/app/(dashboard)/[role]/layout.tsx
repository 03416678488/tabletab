import { redirect } from "next/navigation";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { StaffAuthGuard } from "@/features/dashboard/components/staff-auth-guard";
import { isStaffRole } from "@/lib/roles";

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  // The dashboard sits at a root-level `[role]` segment, so it would otherwise
  // capture any storefront page slug (e.g. a "menu" nav link → `/menu`) and
  // bounce visitors into the staff dashboard/login. Anything that isn't a real
  // staff role is a storefront custom page: send it to `/p/{slug}`.
  if (!isStaffRole(role)) redirect(`/p/${role}`);

  return (
    <StaffAuthGuard>
      <AppShell>{children}</AppShell>
    </StaffAuthGuard>
  );
}
