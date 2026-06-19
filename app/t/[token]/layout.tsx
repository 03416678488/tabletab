import { ThemeProvider } from "@/components/brand/theme-provider";
import { VenueShell } from "@/components/venue/venue-shell";

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider className="min-h-dvh">
      <VenueShell>{children}</VenueShell>
    </ThemeProvider>
  );
}
