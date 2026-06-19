import { StaffAuthGuard } from "@/components/app/staff-auth-guard";
import { OwnerGuard } from "@/components/app/owner-guard";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthGuard>
      <OwnerGuard>{children}</OwnerGuard>
    </StaffAuthGuard>
  );
}
