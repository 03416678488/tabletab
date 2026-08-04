"use client";

import { SessionProvider } from "next-auth/react";

/** Console providers — just the auth session; token refresh is handled in auth.ts. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
