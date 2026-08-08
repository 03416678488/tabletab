import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Root 404 fallback for any path outside the storefront/dashboard groups. */
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-subtle px-4 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-tint text-brand">
        <Compass className="size-8" aria-hidden />
      </div>
      <p className="font-display text-6xl font-bold leading-none text-ink">404</p>
      <h1 className="mt-4 font-display text-xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-7">
        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
