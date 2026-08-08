import Link from "next/link";
import { Compass, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

/** 404 for the customer storefront — rendered inside the storefront chrome
 *  (header/footer) so it stays on-brand. */
export default function StorefrontNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-tint text-brand">
        <Compass className="size-8" aria-hidden />
      </div>
      <p className="font-display text-6xl font-bold leading-none text-ink">404</p>
      <h1 className="mt-4 font-display text-xl font-semibold text-ink">
        This page isn&apos;t on the menu
      </h1>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-7">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="size-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
