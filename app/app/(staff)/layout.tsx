import { AppShell } from "@/components/app/app-shell";
import { ReservationTimerProvider } from "@/components/app/reservation-timer-provider";
import { StaffAuthGuard } from "@/components/app/staff-auth-guard";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthGuard>
      <ReservationTimerProvider>
        <AppShell>{children}</AppShell>
      </ReservationTimerProvider>
    </StaffAuthGuard>
  );
}
