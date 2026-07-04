import { Clock, Leaf, Sparkles, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HomeCtaBand, HomeHero } from "@/components/storefront/home-hero";

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
      <HomeHero />

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
                <Card key={prop.title} className="border-border/80 transition-shadow hover:shadow-[var(--shadow-elevated)]">
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

      <HomeCtaBand />
    </div>
  );
}
