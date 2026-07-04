"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { useTenant } from "@/hooks/use-tenant";

export function HomeHero() {
  const tenant = useTenant();

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <StatusPill tone="brand" className="mb-4">
            {tenant.tagline}
          </StatusPill>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Mediterranean flavors,{" "}
            <span className="text-brand">delivered with care</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Order from {tenant.name} for delivery or pickup. Fresh wood-fired pizza,
            vibrant small plates, and signature mains — straight from our kitchen to you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/order">
                Start your order <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Delivery in ~35 min · Pickup in as little as 15 min · 2 Portland locations
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)] lg:aspect-square"
        >
          <Image
            src="https://picsum.photos/seed/tabletap-hero-food/900/900"
            alt="Wood-fired pizza and Mediterranean dishes"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-surface/95 p-4 backdrop-blur-sm">
            <p className="font-display font-semibold text-ink">Tonight&apos;s favorites</p>
            <p className="text-sm text-muted-foreground">
              Margherita pizza, Miso Salmon &amp; Burrata — loved by our guests
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function HomeCtaBand() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-12 text-center text-primary-foreground sm:px-12">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <h2 className="relative font-display text-2xl font-bold sm:text-3xl">
            Ready when you are
          </h2>
          <p className="relative mx-auto mt-3 max-w-md opacity-90">
            Pick your nearest branch, build your order, and track it every step of the way.
          </p>
          <Button asChild size="lg" variant="secondary" className="relative mt-6">
            <Link href="/order">
              Order now <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
