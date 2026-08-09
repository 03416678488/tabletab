"use client";

import { useSession } from "next-auth/react";

import type { SessionUser } from "@/features/auth/types/auth.types";

/**
 * The authenticated user from the NextAuth session (reactive). Includes the
 * user's `branchId` — the home branch of a single-branch employee. Returns null
 * when there is no session.
 */
export function useSessionUser(): SessionUser | null {
  const { data } = useSession();
  return (data?.user as unknown as SessionUser) ?? null;
}
