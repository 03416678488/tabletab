"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChefHat, ConciergeBell, LayoutDashboard, LogIn, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { roleHomePath, ROLE_LABELS } from "@/lib/nav";
import { useSession } from "@/hooks/use-session";
import type { StaffRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: { role: StaffRole; icon: typeof ChefHat; description: string }[] = [
  { role: "waiter", icon: ConciergeBell, description: "Tables, serve & guest requests" },
  { role: "chef", icon: ChefHat, description: "Kitchen display & order prep" },
  { role: "manager", icon: ShieldCheck, description: "Branch ops & oversight" },
  { role: "owner", icon: LayoutDashboard, description: "Full platform access" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const login = useSession((s) => s.login);
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  const user = useSession((s) => s.user);

  const [email, setEmail] = useState("marcus@oliveandash.com");
  const [password, setPassword] = useState("staff");
  const [role, setRole] = useState<StaffRole>("chef");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useSession.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useSession.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated && user) {
      router.replace(returnUrl ?? roleHomePath(user.role));
    }
  }, [hydrated, isAuthenticated, user, returnUrl, router]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Email is required";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    login(role);
    router.push(returnUrl ?? roleHomePath(role));
  };

  if (!hydrated) {
    return <Skeleton className="mx-auto mt-24 h-96 w-full max-w-md" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex justify-center">
        <Logo href="/" />
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
            <LogIn className="size-6" />
          </div>
          <CardTitle>Staff sign in</CardTitle>
          <CardDescription>
            Demo login — pick a role to preview that dashboard. Any email/password works.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">Sign in as</legend>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ role: r, icon: Icon, description }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex flex-col items-start rounded-xl border p-3 text-left transition-colors",
                      role === r
                        ? "border-brand bg-brand-tint ring-2 ring-brand/20"
                        : "border-border hover:bg-secondary",
                    )}
                  >
                    <Icon className="mb-1.5 size-5 text-brand-deep" />
                    <span className="text-sm font-semibold text-ink">{ROLE_LABELS[r]}</span>
                    <span className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {description}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <Button type="submit" className="w-full" size="lg">
              Continue as {ROLE_LABELS[role]}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="text-brand hover:underline">
              ← Back to storefront
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-md" />}>
      <LoginForm />
    </Suspense>
  );
}
