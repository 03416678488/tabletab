"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";
import { AUTH_MESSAGES } from "@/features/auth/constants/auth.constants";

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

      // Land on the console (or back to the page that sent us to login).
      const callbackUrl = searchParams.get("callbackUrl") || "/tenants";
      router.push(callbackUrl);
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
