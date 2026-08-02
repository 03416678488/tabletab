"use client";

import { useCallback, useEffect, useState } from "react";

import { rolePermissionService } from "@/features/role-permission/services/role-permission.service";
import type {
  MyAccess,
  PermissionAction,
} from "@/features/role-permission/types/role-permission.types";

// Shared across the app so nav + page guards trigger a single fetch.
let cache: MyAccess | null = null;
let inflight: Promise<MyAccess> | null = null;

/** The signed-in user's effective permissions, with helpers for gating UI. */
export function useMyAccess() {
  const [access, setAccess] = useState<MyAccess | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    inflight ??= rolePermissionService.me();
    let alive = true;
    inflight
      .then((a) => {
        cache = a;
        if (alive) setAccess(a);
      })
      .catch(() => {
        // On failure, fail open (don't lock the user out of their own UI).
        if (alive) setAccess({ isSuperAdmin: true, grants: {} });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const can = useCallback(
    (module: string, action: PermissionAction) => {
      if (!access) return true; // don't flash-hide while loading
      if (access.isSuperAdmin) return true;
      return (access.grants[module] ?? []).includes(action);
    },
    [access],
  );

  const canView = useCallback((module?: string) => (module ? can(module, "read") : true), [can]);

  return {
    access,
    loading,
    isSuperAdmin: access?.isSuperAdmin ?? false,
    can,
    canView,
  };
}

/** Clear the cached access (call after permissions change). */
export function resetMyAccessCache() {
  cache = null;
  inflight = null;
}
