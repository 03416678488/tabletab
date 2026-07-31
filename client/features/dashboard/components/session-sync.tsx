"use client";

import { useEffect } from "react";
import { useSession as useAuthSession } from "next-auth/react";

import { useSession as useStaffSession } from "@/hooks/use-session";
import { mapApiRolesToStaffRole } from "@/lib/roles";

/**
 * Bridges the NextAuth session into the staff session store so the /app shell
 * (topbar, sidebar, guards, boards) reads the real signed-in user. Renders
 * nothing; must live inside <SessionProvider>.
 */
export function SessionSync() {
  const { data, status } = useAuthSession();
  const setSession = useStaffSession((s) => s.setSession);

  useEffect(() => {
    if (status === "loading") {
      setSession(null, "loading");
      return;
    }

    if (status === "authenticated" && data?.user) {
      const u = data.user;
      setSession(
        {
          id: u.id,
          name:
            u.name ||
            `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
            u.email,
          email: u.email,
          role: mapApiRolesToStaffRole(u.roleNames),
          // The API doesn't scope branches yet; owners implicitly see all.
          branchIds: [],
          active: true,
        },
        "authenticated",
      );
      return;
    }

    setSession(null, "unauthenticated");
  }, [status, data, setSession]);

  return null;
}
