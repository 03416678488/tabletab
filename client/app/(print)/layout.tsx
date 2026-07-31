import { StaffAuthGuard } from "@/features/dashboard/components/staff-auth-guard";
import { AdminGuard } from "@/features/dashboard/components/admin-guard";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthGuard>
      <AdminGuard>{children}</AdminGuard>
    </StaffAuthGuard>
  );
}
