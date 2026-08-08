"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Runtime error boundary for the customer storefront. */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for logging/observability.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <TriangleAlert className="size-8" aria-hidden />
      </div>
      <h1 className="font-display text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        We hit a snag loading this page. Please try again in a moment.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/70">Reference: {error.digest}</p>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home className="size-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
