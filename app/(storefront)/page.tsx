import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Leaf, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { TENANT } from "@/lib/mock";

const valueProps = [
  {
    icon: Leaf,
    title: "Seasonal ingredients",
    description: "Farm-to-table produce and responsibly sourced proteins, prepared daily.",
  },
  {
    icon: Truck,
    title: "Delivery & pickup",
    description: "Hot meals to your door or ready when you arrive — you choose.",
  },
  {
    icon: Clock,
    title: "Live order tracking",
    description: "Follow every step from kitchen to your table with real-time updates.",
  },
  {
    icon: Sparkles,
    title: "Chef-crafted menu",
    description: "Wood-fired pizza, Mediterranean mains, and house-made desserts.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-hero-glow">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <StatusPill tone="brand" className="mb-4">
              {TENANT.tagline}
            </StatusPill>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Mediterranean flavors,{" "}
              <span className="text-brand">delivered with care</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Order from {TENANT.name} for delivery or pickup. Fresh wood-fired pizza,
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
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)] lg:aspect-square">
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
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-border bg-surface/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Why order with us
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Premium hospitality meets seamless online ordering — the same quality you
              get in our dining room, wherever you are.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((prop) => {
              const Icon = prop.icon;
              return (
                <Card key={prop.title} className="border-border/80">
                  <CardContent className="p-6">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display font-semibold text-ink">{prop.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {prop.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-12 text-center text-white sm:px-12">
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
            <h2 className="relative font-display text-2xl font-bold sm:text-3xl">
              Ready when you are
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-brand-tint/90">
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
    </div>
  );
}
