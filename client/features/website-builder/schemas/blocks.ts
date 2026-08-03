import { z } from "zod";

/**
 * Zod is the single source of truth for block config shapes. Each block type
 * has a schema; the page content (blocks + header + footer) composes them.
 * Types are inferred from these schemas — never hand-written separately.
 */

export const BLOCK_TYPES = [
  "hero",
  "image-slider",
  "promo",
  "category-grid",
  "featured-categories",
  "product-carousel",
  "rich-cta",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

const url = z.string().trim();

// ── Per-block config schemas ──────────────────────────────────────────────

export const heroConfigSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().default(""),
  imageUrl: url.default(""),
  ctaLabel: z.string().default(""),
  ctaHref: z.string().default(""),
  align: z.enum(["left", "center"]).default("center"),
});

export const sliderImageSchema = z.object({
  url: url.min(1, "Image URL is required"),
  caption: z.string().default(""),
  href: z.string().default(""),
});

export const imageSliderConfigSchema = z.object({
  title: z.string().default(""),
  autoplay: z.boolean().default(true),
  images: z.array(sliderImageSchema).min(1, "Add at least one image"),
});

export const promoBannerSchema = z.object({
  eyebrow: z.string().default(""),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().default(""),
  cta: z.string().default(""),
  href: z.string().default(""),
  imageUrl: url.default(""),
});

export const promoConfigSchema = z.object({
  variant: z.enum(["triple", "double", "full"]).default("triple"),
  banners: z.array(promoBannerSchema).min(1, "Add at least one banner"),
});

export const categoryGridConfigSchema = z.object({
  title: z.string().default("Browse by category"),
  layout: z.enum(["grid", "slider"]).default("grid"),
  limit: z.coerce.number().int().min(1).max(24).default(8),
});

export const featuredCategoriesConfigSchema = z.object({
  title: z.string().default(""),
  /** Ordered category ids to feature, each rendered as its own section. */
  categoryIds: z.array(z.string()).default([]),
  layout: z.enum(["grid", "slider"]).default("slider"),
  limit: z.coerce.number().int().min(1).max(24).default(8),
  showViewAll: z.boolean().default(true),
});

export const productCarouselConfigSchema = z.object({
  title: z.string().default("Popular right now"),
  source: z.string().default("popular"), // "popular" | a category id
  layout: z.enum(["grid", "slider"]).default("slider"),
  limit: z.coerce.number().int().min(1).max(24).default(8),
});

export const richCtaConfigSchema = z.object({
  heading: z.string().min(1, "Heading is required"),
  text: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaHref: z.string().default(""),
  tone: z.enum(["brand", "dark", "light"]).default("brand"),
});

/** Map of block type → its config schema. */
export const BLOCK_CONFIG_SCHEMAS = {
  hero: heroConfigSchema,
  "image-slider": imageSliderConfigSchema,
  promo: promoConfigSchema,
  "category-grid": categoryGridConfigSchema,
  "featured-categories": featuredCategoriesConfigSchema,
  "product-carousel": productCarouselConfigSchema,
  "rich-cta": richCtaConfigSchema,
} satisfies Record<BlockType, z.ZodTypeAny>;

// ── Block instance + page content ─────────────────────────────────────────

export const blockSchema = z.object({
  id: z.string(),
  type: z.enum(BLOCK_TYPES),
  hidden: z.boolean().default(false),
  config: z.record(z.string(), z.unknown()),
});

export const headerConfigSchema = z.object({
  // Empty = fall back to the restaurant's real name (from tenant settings).
  brandName: z.string().default(""),
  showSearch: z.boolean().default(true),
  showLocation: z.boolean().default(true),
  ctaLabel: z.string().default("Order now"),
  ctaHref: z.string().default("/order"),
  links: z
    .array(z.object({ label: z.string(), href: z.string() }))
    .default([]),
});

export const footerConfigSchema = z.object({
  about: z.string().default(""),
  columns: z
    .array(
      z.object({
        heading: z.string(),
        links: z.array(z.object({ label: z.string(), href: z.string() })),
      }),
    )
    .default([]),
  socials: z
    .array(z.object({ platform: z.string(), href: z.string() }))
    .default([]),
  copyright: z.string().default(""),
});

export const SLUG_RULE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const seoSchema = z.object({
  metaTitle: z.string().default(""),
  metaDescription: z.string().default(""),
  ogImage: z.string().default(""),
  noindex: z.boolean().default(false),
});

export const generalSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "URL slug is required")
    .regex(SLUG_RULE, "Use lowercase letters, numbers, and hyphens"),
});

export const createPageSchema = generalSchema;

export const pageContentSchema = z.object({
  blocks: z.array(blockSchema).default([]),
  header: headerConfigSchema.default(headerConfigSchema.parse({})),
  footer: footerConfigSchema.default(footerConfigSchema.parse({})),
});

// ── Inferred types ────────────────────────────────────────────────────────

export type HeroConfig = z.infer<typeof heroConfigSchema>;
export type SliderImage = z.infer<typeof sliderImageSchema>;
export type ImageSliderConfig = z.infer<typeof imageSliderConfigSchema>;
export type PromoBanner = z.infer<typeof promoBannerSchema>;
export type PromoConfig = z.infer<typeof promoConfigSchema>;
export type CategoryGridConfig = z.infer<typeof categoryGridConfigSchema>;
export type FeaturedCategoriesConfig = z.infer<typeof featuredCategoriesConfigSchema>;
export type ProductCarouselConfig = z.infer<typeof productCarouselConfigSchema>;
export type RichCtaConfig = z.infer<typeof richCtaConfigSchema>;

export type Block = z.infer<typeof blockSchema>;
export type HeaderConfig = z.infer<typeof headerConfigSchema>;
export type FooterConfig = z.infer<typeof footerConfigSchema>;
export type PageContent = z.infer<typeof pageContentSchema>;
export type PageSeo = z.infer<typeof seoSchema>;
export type GeneralForm = z.infer<typeof generalSchema>;

/** Parse a block's raw config against its schema (fills defaults). */
export function parseBlockConfig<T extends BlockType>(
  type: T,
  raw: unknown,
): z.infer<(typeof BLOCK_CONFIG_SCHEMAS)[T]> {
  return BLOCK_CONFIG_SCHEMAS[type].parse(raw ?? {}) as z.infer<
    (typeof BLOCK_CONFIG_SCHEMAS)[T]
  >;
}
