/** The QR landing resolves the table then redirects into the storefront, so this
    is just a full-screen container for the brief resolving state. Brand colours
    come from the root SettingsProvider (admin settings). */
export default function QrLandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-subtle p-6">
      {children}
    </div>
  );
}
