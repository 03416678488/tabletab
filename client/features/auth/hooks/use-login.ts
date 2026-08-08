"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";

import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";
import { AUTH_MESSAGES } from "@/features/auth/constants/auth.constants";
import { isStaffRole, mapApiRolesToStaffRole } from "@/lib/roles";
import { canAccessSlug, homePathForRole } from "@/lib/permissions";
import type { StaffRole } from "@/lib/types";

/**
 * A `callbackUrl` carried on the login page belongs to whoever was bounced here
 * last — which may be a *different* role than the person now signing in. Only
 * honor it when it targets this user's own namespace and a page they may open;
 * otherwise send them to their own dashboard. Prevents e.g. a rider inheriting
 * a chef's `?callbackUrl=/chef/kitchen` and landing on the chef KDS.
 */
function safeRedirect(callbackUrl: string | null, role: StaffRole): string {
  if (!callbackUrl || !callbackUrl.startsWith("/")) return homePathForRole(role);
  const segments = callbackUrl.split(/[?#]/)[0].split("/").filter(Boolean);
  const first = segments[0] ?? "";
  // Not a dashboard path (or a different role's namespace) → own dashboard.
  if (!isStaffRole(first) || first !== role) return homePathForRole(role);
  const slug = segments[1] ?? "dashboard";
  return canAccessSlug(role, slug) ? callbackUrl : homePathForRole(role);
}

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!res || res.error) {
        // authorize() returned null (bad creds) or threw.
        setFormError(AUTH_MESSAGES.invalidCredentials);
        return;
      }

      // Send the user to their role's dashboard, or back to where they came
      // from only if that destination is valid for THIS user's role.
      const session = await getSession();
      const role = mapApiRolesToStaffRole(session?.user?.roleNames ?? []);
      router.push(safeRedirect(searchParams.get("callbackUrl"), role));
      router.refresh();
    } catch {
      setFormError(AUTH_MESSAGES.genericError);
    }
  });

  return {
    form,
    onSubmit,
    formError,
    isSubmitting: form.formState.isSubmitting,
  };
}
