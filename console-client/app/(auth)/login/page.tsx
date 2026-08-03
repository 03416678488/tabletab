import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/components/login-form";

export default function OwnerLoginPage() {
  return (
    <Suspense
      fallback={<Skeleton className="mx-auto mt-24 h-96 w-full max-w-md" />}
    >
      <LoginForm />
    </Suspense>
  );
}
