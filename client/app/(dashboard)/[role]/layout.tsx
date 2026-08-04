import { AppShell } from "@/features/dashboard/components/app-shell";
import { ReservationTimerProvider } from "@/features/dashboard/components/reservation-timer-provider";
import { StaffAuthGuard } from "@/features/dashboard/components/staff-auth-guard";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthGuard>
      <ReservationTimerProvider>
        <AppShell>{children}</AppShell>
      </ReservationTimerProvider>
    </StaffAuthGuard>
  );
}
