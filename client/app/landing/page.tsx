import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  CalendarCheck,
  Check,
  ChefHat,
  MapPin,
  MonitorPlay,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "TableTap — Run your whole restaurant from one place",
  description:
    "POS, QR dine-in ordering, online storefront, reservations, kitchen display, inventory and live analytics — one platform for single sites and multi-branch groups.",
};

const FEATURES = [
  {
    icon: ScanLine,
    title: "QR dine-in ordering",
    body: "Guests scan the table code, order and pay from their phone. Rounds flow straight to the kitchen — no app to install.",
  },
  {
    icon: ShoppingBag,
    title: "Online storefront",
    body: "A branded ordering site for delivery and pickup, with live order tracking and your own menu, hours and delivery zones.",
  },
  {
    icon: MonitorPlay,
    title: "POS + kitchen display",
    body: "Fast point-of-sale for staff and a real-time KDS for the line — tickets, timings and status synced everywhere at once.",
  },
  {
    icon: CalendarCheck,
    title: "Reservations & events",
    body: "Take bookings and deposits, manage tables and run private events — all on the same calendar your floor staff use.",
  },
  {
    icon: Boxes,
    title: "Inventory & recipes",
    body: "Track stock per branch, deduct ingredients automatically on every sale, and get low-stock alerts before you run out.",
  },
  {
    icon: BarChart3,
    title: "Live analytics",
    body: "Sales, top items, and per-branch performance in real time — with the numbers your accountant actually asks for.",
  },
];

const HIGHLIGHTS = [
  "One menu, synced across POS, QR, and your storefront",
  "Per-branch pricing, stock, staff and reporting",
  "Role-based access for owners, managers, chefs and waiters",
  "Live order status on every screen — floor, kitchen and guest",
];

const STATS = [
  { value: "6-in-1", label: "POS, QR, online, bookings, kitchen, stock" },
  { value: "Real-time", label: "Orders sync across every screen" },
  { value: "Multi-branch", label: "Run one site or a whole group" },
  { value: "No hardware lock-in", label: "Works on the tablets you have" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <AllInOne />
        <StatsBand />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ header */

function Wordmark() {
  return (
    <Link href="/landing" className="flex items-center gap-2" aria-label="TableTap home">
      <span className="flex size-8 items-center justify-center rounded-xl bg-brand text-primary-foreground shadow-sm">
        <UtensilsCrossed className="size-5" aria-hidden />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-ink">TableTap</span>
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-ink">
            Features
          </a>
          <a href="#how" className="transition-colors hover:text-ink">
            How it works
          </a>
          <a href="#why" className="transition-colors hover:text-ink">
            Why TableTap
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">
              Get started <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------- hero */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Warm brand glow, purely decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_0%,var(--brand-tint),transparent),radial-gradient(45%_45%_at_100%_10%,var(--accent-tint),transparent)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            The all-in-one restaurant platform
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl">
            Run your whole restaurant from one place.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            TableTap brings your point-of-sale, QR dine-in ordering, online storefront, bookings,
            kitchen display and inventory together — so every order lands in the right place,
            automatically.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-[15px]">
              <Link href="/login">
                Get started free <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-[15px]">
              <a href="#features">See what&rsquo;s inside</a>
            </Button>
          </div>
          <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-brand" aria-hidden /> No card required
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-brand" aria-hidden /> Works on your tablets
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-brand" aria-hidden /> Set up in a day
            </li>
          </ul>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

/** A lightweight, theme-aware product mock (no image asset). */
function HeroPreview() {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-1000">
      <div className="rounded-3xl border border-border bg-surface/70 p-3 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="rounded-2xl border border-border bg-subtle p-4">
          {/* mock top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-primary-foreground">
                <UtensilsCrossed className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-ink">Live orders</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> Open
            </span>
          </div>

          {/* mock order rows */}
          <div className="mt-4 space-y-2">
            {[
              { n: "ORD-1042", t: "Table 6 · Dine-in", s: "Preparing", tone: "amber" },
              { n: "ORD-1041", t: "Online · Delivery", s: "Out for delivery", tone: "sky" },
              { n: "ORD-1040", t: "Table 2 · Dine-in", s: "Served", tone: "emerald" },
            ].map((o) => (
              <div
                key={o.n}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{o.n}</p>
                  <p className="text-xs text-muted-foreground">{o.t}</p>
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs font-medium " +
                    (o.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : o.tone === "sky"
                        ? "bg-sky-50 text-sky-700"
                        : "bg-emerald-50 text-emerald-700")
                  }
                >
                  {o.s}
                </span>
              </div>
            ))}
          </div>

          {/* mock stat tiles */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { k: "Today", v: "$4,280" },
              { k: "Orders", v: "138" },
              { k: "Avg time", v: "11m" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border bg-surface p-3">
                <p className="text-[11px] text-muted-foreground">{s.k}</p>
                <p className="mt-0.5 font-display text-lg font-bold text-ink tabular-nums">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- trust strip */

function TrustStrip() {
  return (
    <section className="border-y border-border bg-subtle" id="why">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-sm font-medium text-muted-foreground">
          Built for cafés, quick-service and full-service — single sites to multi-branch groups.
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="flex" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
            ))}
          </span>
          <span className="font-medium text-ink">Loved by busy floors</span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- features */

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink text-balance sm:text-4xl">
          Everything the front and back of house need
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          One connected system instead of five apps that don&rsquo;t talk to each other.
        </p>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-tint text-brand transition-colors group-hover:bg-brand group-hover:text-primary-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- all-in-one */

function AllInOne() {
  return (
    <section id="how" className="border-y border-border bg-subtle">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-brand">
            One source of truth
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink text-balance sm:text-4xl">
            Update once. It&rsquo;s live everywhere.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Change a price, mark an item sold out, or add a branch — and every screen updates
            instantly: the POS, the QR menu, your storefront, and the kitchen line.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <span className="text-[15px] text-ink">{h}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/login">
                Start your first branch <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        {/* role tiles */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: ScanLine, k: "Guests", v: "Scan, order, pay" },
            { icon: ChefHat, k: "Kitchen", v: "Live ticket board" },
            { icon: MapPin, k: "Managers", v: "Every branch, one view" },
            { icon: Bell, k: "Staff", v: "Instant order alerts" },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-tint text-amber-600">
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">{k}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- stats band */

function StatsBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.value}
            className="rounded-2xl border border-border bg-surface p-6 text-center"
          >
            <p className="font-display text-2xl font-bold text-brand">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- final CTA */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(245,158,11,0.18),transparent),radial-gradient(40%_50%_at_100%_100%,rgba(195,9,12,0.28),transparent)]"
        />
        <div className="relative mx-auto max-w-2xl">
          <ShieldCheck className="mx-auto size-8 text-amber-400" aria-hidden />
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
            Bring your restaurant online today
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Set up your menu, print your table QR codes, and take your first order — often on the
            same day.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 bg-white px-6 text-[15px] text-ink hover:bg-white/90"
            >
              <Link href="/login">
                Get started free <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/25 bg-transparent px-6 text-[15px] text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-subtle">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <Wordmark />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href="#features" className="transition-colors hover:text-ink">
            Features
          </a>
          <a href="#how" className="transition-colors hover:text-ink">
            How it works
          </a>
          <Link href="/login" className="transition-colors hover:text-ink">
            Sign in
          </Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} TableTap</p>
      </div>
    </footer>
  );
}
