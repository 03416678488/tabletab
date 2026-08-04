"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2, Rocket, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/features/tenants/schemas/tenant";
import {
  SIGNUP_PLANS,
  type SignupForm as SignupFormValues,
  signupSchema,
} from "@/features/signup/schemas/signup";
import {
  type SignupResult,
  signupService,
} from "@/features/signup/services/signup.service";

const APP_DOMAIN =
  process.env.NEXT_PUBLIC_PLATFORM_APP_DOMAIN?.trim() || "yourapp.com";

export function SignupForm() {
  const [result, setResult] = useState<SignupResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { restaurantName: "", handle: "", email: "", password: "", plan: "trial" },
  });

  const nameValue = watch("restaurantName");
  const handleValue = watch("handle") ?? "";
  const planValue = watch("plan") ?? "trial";

  // Auto-fill the handle from the name until the user edits it directly.
  useEffect(() => {
    if (!dirtyFields.handle) setValue("handle", slugify(nameValue ?? ""));
  }, [nameValue, dirtyFields.handle, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      setResult(await signupService.create(values));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Signup failed — please try again");
    }
  });

  if (result) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle>{result.tenant.name} is live</CardTitle>
            <CardDescription>
              Your workspace is ready. Sign in with the email you just registered.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-xl border border-border bg-subtle/50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-brand" />
                <a
                  href={result.storefrontUrl}
                  className="truncate font-mono text-brand hover:underline"
                >
                  {result.storefrontUrl}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="size-4 text-brand" />
                <a
                  href={result.adminUrl}
                  className="truncate font-mono text-brand hover:underline"
                >
                  {result.adminUrl}
                </a>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">
                Go to sign in <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
            <Rocket className="size-6" />
          </div>
          <CardTitle>Start your restaurant</CardTitle>
          <CardDescription>
            Spin up your own TableTap workspace in seconds.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
              >
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant name</Label>
              <Input
                id="restaurantName"
                placeholder="Pixel Diner"
                aria-invalid={!!errors.restaurantName}
                {...register("restaurantName")}
              />
              {errors.restaurantName && (
                <p className="text-xs text-destructive">{errors.restaurantName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                className="font-mono"
                placeholder="pixel-diner"
                aria-invalid={!!errors.handle}
                {...register("handle")}
              />
              <p className="text-xs text-muted-foreground">
                Your site:{" "}
                <span className="font-mono text-ink">
                  {handleValue || "your-handle"}.{APP_DOMAIN}
                </span>
              </p>
              {errors.handle && (
                <p className="text-xs text-destructive">{errors.handle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Your email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@restaurant.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Plan</Label>
              <Dropdown
                value={planValue}
                onChange={(v) => setValue("plan", v, { shouldDirty: true })}
                options={SIGNUP_PLANS}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              Create my workspace
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
