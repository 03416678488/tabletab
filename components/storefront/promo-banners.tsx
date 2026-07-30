import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&h=560&q=70`;

interface Promo {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  /** Overlay gradient tint for legibility + on-brand feel. */
  overlay: string;
}

// Row 1 — three banners
const ROW_TRIPLE: Promo[] = [
  {
    id: "free-delivery",
    eyebrow: "Limited time",
    title: "Free delivery",
    subtitle: "On your first order over $25",
    cta: "Order now",
    href: "/order",
    image: unsplash("1526367790999-0150786686a2"),
    overlay: "from-brand-deep/90 via-brand-deep/50",
  },
  {
    id: "chef-specials",
    eyebrow: "This week",
    title: "Chef's specials · 20% off",
    subtitle: "Handpicked plates, limited time",
    cta: "Explore",
    href: "/order",
    image: unsplash("1517248135467-4c7edcad34c4"),
    overlay: "from-ink/90 via-ink/50",
  },
  {
    id: "family-bundle",
    eyebrow: "Save more",
    title: "Family bundles",
    subtitle: "Feed everyone for less",
    cta: "See bundles",
    href: "/order",
    image: unsplash("1504674900247-0877df9cc836"),
    overlay: "from-accent/90 via-accent/40",
  },
];

// Row 2 — two banners
const ROW_DOUBLE: Promo[] = [
  {
    id: "weekend-brunch",
    eyebrow: "Weekends",
    title: "Bottomless brunch",
    subtitle: "Saturday & Sunday, till 3pm",
    cta: "Reserve a table",
    href: "/order",
    image: unsplash("1513104890138-7c749659a591"),
    overlay: "from-brand-deep/90 via-brand-deep/50",
  },
  {
    id: "happy-hour",
    eyebrow: "5–7pm daily",
    title: "Happy hour deals",
    subtitle: "2-for-1 on drinks & small plates",
    cta: "See menu",
    href: "/order",
    image: unsplash("1551024601-bec78aea704b"),
    overlay: "from-ink/90 via-ink/50",
  },
];

// Row 3 — full-width banner
const ROW_FULL: Promo = {
  id: "app-offer",
  eyebrow: "New here?",
  title: "Get 30% off your first 3 orders",
  subtitle: "Fresh from Olive & Ash, delivered fast",
  cta: "Start ordering",
  href: "/order",
  image: unsplash("1414235077428-338989a2e8c0"),
  overlay: "from-ink/90 via-ink/40",
};

/** Row 1 — three banners, swipeable on mobile, 3-up on desktop. */
export function PromoTriple() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        {ROW_TRIPLE.map((promo) => (
          <Banner
            key={promo.id}
            promo={promo}
            className="aspect-[16/9] min-w-[85%] snap-start sm:min-w-[46%] lg:aspect-[16/10] lg:min-w-0"
          />
        ))}
      </div>
    </section>
  );
}

/** Row 2 — two banners, swipeable on mobile, 2-up on desktop. */
export function PromoDouble() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {ROW_DOUBLE.map((promo) => (
          <Banner
            key={promo.id}
            promo={promo}
            className="aspect-[16/9] min-w-[90%] snap-start sm:aspect-[2/1] sm:min-w-0"
          />
        ))}
      </div>
    </section>
  );
}

/** Row 3 — a single full-width banner. */
export function PromoFull() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <Banner promo={ROW_FULL} className="aspect-[16/9] w-full sm:aspect-[16/5]" />
    </section>
  );
}

function Banner({ promo, className }: { promo: Promo; className?: string }) {
  return (
    <Link
      href={promo.href}
      className={cn(
        "group relative flex shrink-0 overflow-hidden rounded-2xl shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <Image
        src={promo.image}
        alt={promo.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 1024px) 100vw, 33vw"
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${promo.overlay} to-transparent`} />
      <div className="relative flex flex-col justify-center gap-1 p-5 text-white sm:p-6">
        <span className="w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm">
          {promo.eyebrow}
        </span>
        <h3 className="font-display text-xl font-bold leading-tight sm:text-2xl">{promo.title}</h3>
        <p className="text-sm text-white/90">{promo.subtitle}</p>
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-ink transition-all group-hover:gap-2">
          {promo.cta}
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
