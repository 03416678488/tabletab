import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AppImage } from "@/components/ui/app-image";
import { cn, isLocalUpload } from "@/lib/utils";
import { EmblaSlider } from "@/features/website-builder/render/embla-slider";
import type {
  BannerSliderConfig,
  HeroConfig,
  ImageSliderConfig,
  PromoConfig,
  RichCtaConfig,
  RichTextConfig,
} from "@/features/website-builder/schemas/blocks";

const shell = "mx-auto max-w-6xl px-4 sm:px-6";

export function HeroRender({ config }: { config: HeroConfig }) {
  return (
    <section className={cn(shell, "py-4")}>
      <div className="relative overflow-hidden rounded-3xl bg-ink">
        {config.imageUrl && (
          <Image
            src={config.imageUrl}
            alt=""
            width={1600}
            height={800}
            unoptimized={isLocalUpload(config.imageUrl)}
            className="h-[280px] w-full object-cover opacity-80 sm:h-[380px]"
          />
        )}
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-center gap-3 bg-gradient-to-r from-ink/80 to-ink/10 p-6 sm:p-12",
            config.align === "center" && "items-center text-center",
          )}
        >
          <h1 className="max-w-2xl font-display text-3xl font-bold text-white sm:text-5xl">
            {config.title}
          </h1>
          {config.subtitle && (
            <p className="max-w-xl text-base text-white/85 sm:text-lg">{config.subtitle}</p>
          )}
          {config.ctaLabel && (
            <Link
              href={config.ctaHref || "#"}
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-hover"
            >
              {config.ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function ImageSliderRender({ config }: { config: ImageSliderConfig }) {
  // Always one-up on mobile/tablet; the multi-up grid only kicks in on desktop.
  // Clean fractions — the inter-slide gap comes from each slide's left padding
  // (see EmblaSlider), which is inside the basis width, so `perView` slides fit
  // the content column exactly and stay flush with the section title.
  const perViewBasis =
    {
      1: "basis-full",
      2: "basis-full lg:basis-1/2",
      3: "basis-full lg:basis-1/3",
      4: "basis-full lg:basis-1/4",
    }[config.perView] ?? "basis-full";

  // Multi-up slides are tall portrait cards on desktop; but when they collapse to
  // one-up below `lg` a wide banner ratio reads better. Single slides stay wide.
  const slideAspect = config.perView > 1 ? "aspect-[16/9] lg:aspect-[3/4]" : "aspect-[21/9]";

  return (
    <section className={cn(shell, "py-4")}>
      {config.title && (
        <h2 className="mb-4 font-display text-xl font-bold text-ink sm:text-2xl">{config.title}</h2>
      )}
      <EmblaSlider
        autoplayMs={config.autoplay ? config.autoplaySeconds * 1000 : undefined}
        slideClassName={perViewBasis}
        showArrows={config.showArrows}
      >
        {config.images.map((img, i) => (
          <Link
            key={i}
            href={img.href || "#"}
            className={cn("relative block overflow-hidden rounded-3xl bg-subtle", slideAspect)}
          >
            <AppImage src={img.url} alt={img.caption} fill className="object-cover" sizes="100vw" />
            {img.badge && (
              <span className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                {img.badge}
              </span>
            )}
            {img.caption && (
              <span className="absolute bottom-4 left-4 rounded-full bg-ink/70 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
                {img.caption}
              </span>
            )}
          </Link>
        ))}
      </EmblaSlider>
    </section>
  );
}

export function PromoRender({ config }: { config: PromoConfig }) {
  const cols =
    config.variant === "full"
      ? "grid-cols-1"
      : config.variant === "double"
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  const aspect = config.variant === "full" ? "aspect-[16/6]" : "aspect-[16/9]";

  return (
    <section className={cn(shell, "py-4")}>
      <div className={cn("grid gap-4", cols)}>
        {config.banners.map((b, i) => (
          <Link
            key={i}
            href={b.href || "#"}
            className={cn(
              "group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-ink p-5 text-white",
              aspect,
            )}
          >
            {b.imageUrl && (
              <Image
                src={b.imageUrl}
                alt=""
                fill
                unoptimized={isLocalUpload(b.imageUrl)}
                className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30" />
            <div className="relative">
              {b.eyebrow && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                  {b.eyebrow}
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{b.title}</h3>
              {b.subtitle && <p className="mt-0.5 text-sm text-white/85">{b.subtitle}</p>}
              {b.cta && (
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold">
                  {b.cta} <ArrowRight className="size-4" />
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function RichCtaRender({ config }: { config: RichCtaConfig }) {
  const tone =
    config.tone === "dark"
      ? "bg-ink text-white"
      : config.tone === "light"
        ? "bg-subtle text-ink"
        : "bg-brand text-primary-foreground";
  return (
    <section className={cn(shell, "py-4")}>
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-3xl px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left",
          tone,
        )}
      >
        <div>
          <h2 className="font-display text-2xl font-bold">{config.heading}</h2>
          {config.text && <p className="mt-1 text-sm opacity-90">{config.text}</p>}
        </div>
        {config.ctaLabel && (
          <Link
            href={config.ctaHref || "#"}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {config.ctaLabel}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

export function RichTextRender({ config }: { config: RichTextConfig }) {
  if (!config.html?.trim()) return null;
  return (
    <section className={cn(shell, "py-4")}>
      <div
        className={cn(
          "rich-text",
          config.width === "prose" && "mx-auto max-w-2xl",
          config.align === "center" && "text-center",
        )}
        // Authored by staff in the builder's WYSIWYG editor (trusted source).
        dangerouslySetInnerHTML={{ __html: config.html }}
      />
    </section>
  );
}

export function BannerSliderRender({ config }: { config: BannerSliderConfig }) {
  const tone =
    config.tone === "dark"
      ? "bg-ink text-white"
      : config.tone === "light"
        ? "bg-subtle text-ink"
        : "bg-brand text-primary-foreground";

  const banner = (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-center gap-2 overflow-hidden rounded-3xl p-8 sm:p-10",
        tone,
      )}
    >
      {config.bannerImage && (
        <Image
          src={config.bannerImage}
          alt=""
          fill
          unoptimized={isLocalUpload(config.bannerImage)}
          className="object-cover opacity-25"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      )}
      <div className="relative">
        {config.eyebrow && (
          <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            {config.eyebrow}
          </span>
        )}
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{config.title}</h2>
        {config.subtitle && (
          <p className="mt-1 text-sm opacity-90 sm:text-base">{config.subtitle}</p>
        )}
        {config.ctaLabel && (
          <Link
            href={config.ctaHref || "#"}
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {config.ctaLabel}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );

  // Slide width per view. Stays 1-up until `lg` — the same breakpoint where the
  // banner moves beside the slider — so narrow widths never cram tiles portrait.
  const perViewBasis =
    {
      1: "basis-full",
      2: "basis-full lg:basis-1/2",
      3: "basis-full lg:basis-1/3",
      4: "basis-full lg:basis-1/4",
    }[config.perView] ?? "basis-full";

  const slider = (
    <EmblaSlider
      autoplayMs={config.autoplay ? config.autoplaySeconds * 1000 : undefined}
      slideClassName={perViewBasis}
      className="h-[320px] min-w-0 sm:h-[380px] lg:h-full"
      fill
      showArrows={config.showArrows}
    >
      {config.images.map((img, i) => (
        <Link
          key={i}
          href={img.href || "#"}
          className="relative block h-full overflow-hidden rounded-3xl bg-subtle"
        >
          <AppImage
            src={img.url}
            alt={img.caption}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {img.badge && (
            <span className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
              {img.badge}
            </span>
          )}
          {img.caption && (
            <span className="absolute bottom-4 left-4 rounded-full bg-ink/70 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
              {img.caption}
            </span>
          )}
        </Link>
      ))}
    </EmblaSlider>
  );

  return (
    <section className={cn(shell, "py-4")}>
      {/* Fixed row height on desktop so the banner and slide images match up;
          stacks with each side keeping its own height on mobile. */}
      <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:h-[380px]">
        {config.bannerSide === "left" ? (
          <>
            {banner}
            {slider}
          </>
        ) : (
          <>
            {slider}
            {banner}
          </>
        )}
      </div>
    </section>
  );
}
