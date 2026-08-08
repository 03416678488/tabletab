import { notFound } from "next/navigation";

/**
 * Catch-all for unmatched dashboard URLs. Unmatched routes would otherwise fall
 * through to the root `app/not-found.tsx` (no dashboard shell); calling
 * `notFound()` here routes them to `[role]/not-found.tsx`, which renders inside
 * the app shell (sidebar/topbar) with a role-aware "Back to dashboard" link.
 * Named sibling routes take priority, so this only fires for genuinely unknown
 * paths.
 */
export default function DashboardCatchAll() {
  notFound();
}
