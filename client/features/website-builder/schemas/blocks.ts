import { z } from "zod";

/**
 * Zod is the single source of truth for block config shapes. Each block type
 * has a schema; the page content (blocks + header + footer) composes them.
 * Types are inferred from these schemas — never hand-written separately.
 */

export const BLOCK_TYPES = [
  "hero",
  "image-slider",
  "banner-slider",
  "promo",
  "menu-grid",
  "featured-categories",
  "product-carousel",
  "promotions",
  "rich-cta",
  "rich-text",
  "reservation",
  "events",
  "menu-slider",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

/** Renamed block types — old stored pages are transparently remapped on read. */
const LEGACY_BLOCK_TYPES: Record<string, BlockType> = {
  "category-grid": "menu-grid",
};

/**
 * Resolve a stored block-type string to a current `BlockType`, applying legacy
 * renames. Returns null for unknown types. Use this wherever raw stored blocks
 * are rendered without first passing through `blockSchema`.
 */
export function normalizeBlockType(type: string): BlockType | null {
  const mapped = LEGACY_BLOCK_TYPES[type] ?? type;
  return (BLOCK_TYPES as readonly string[]).includes(mapped) ? (mapped as BlockType) : null;
}

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
  /** Optional top-right corner label, e.g. "10% Off". */
  badge: z.string().default(""),
});

export const imageSliderConfigSchema = z.object({
  title: z.string().default(""),
  autoplay: z.boolean().default(true),
  /** Seconds each slide stays before advancing (when autoplay is on). */
  autoplaySeconds: z.coerce.number().min(1).max(30).default(4),
  /** How many slides are visible at once. */
  perView: z.coerce.number().int().min(1).max(4).default(1),
  /** Show the prev/next navigation arrows. */
  showArrows: z.boolean().default(true),
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

/** A promo banner on one side + an image slider on the other. */
export const bannerSliderConfigSchema = z.object({
  /** Which side the promo banner sits on (the slider takes the other side). */
  bannerSide: z.enum(["left", "right"]).default("left"),
  // ── Banner side ──
  eyebrow: z.string().default(""),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaHref: z.string().default(""),
  tone: z.enum(["brand", "dark", "light"]).default("brand"),
  bannerImage: url.default(""),
  // ── Slider side ──
  autoplay: z.boolean().default(true),
  autoplaySeconds: z.coerce.number().min(1).max(30).default(4),
  /** How many slides are visible at once on the slider side. */
  perView: z.coerce.number().int().min(1).max(4).default(1),
  /** Show the prev/next navigation arrows on the slider side. */
  showArrows: z.boolean().default(true),
  images: z.array(sliderImageSchema).min(1, "Add at least one image"),
});

export const menuGridConfigSchema = z.object({
  // Always shows every active menu for the selected branch, each as its own
  // section of dishes.
  title: z.string().default("Our menus"),
  layout: z.enum(["grid", "slider"]).default("grid"),
  /** Max dishes shown per menu. */
  limit: z.coerce.number().int().min(1).max(24).default(8),
  showViewAll: z.boolean().default(true),
  /** Show the prev/next navigation arrows (slider layout only). */
  showArrows: z.boolean().default(true),
});

/**
 * A slider of menu *cards* (image + name) — one card per menu, not expanded
 * into dishes. Empty `menuIds` = every active menu, live from the catalog.
 */
export const menuSliderConfigSchema = z.object({
  // Always shows every active menu for the selected branch, one card each.
  title: z.string().default("Explore our menus"),
  /** Show the prev/next navigation arrows. */
  showArrows: z.boolean().default(true),
});

export const featuredCategoriesConfigSchema = z.object({
  // Auto-shows every category for the selected branch, each as its own section.
  title: z.string().default(""),
  layout: z.enum(["grid", "slider"]).default("slider"),
  limit: z.coerce.number().int().min(1).max(24).default(8),
  showViewAll: z.boolean().default(true),
  /** Show the prev/next navigation arrows (slider layout only). */
  showArrows: z.boolean().default(true),
});

export const productCarouselConfigSchema = z.object({
  title: z.string().default("Popular right now"),
  /** Hand-picked products to show, in order. Empty = all products (up to limit). */
  itemIds: z.array(z.string()).default([]),
  layout: z.enum(["grid", "slider"]).default("slider"),
  limit: z.coerce.number().int().min(1).max(24).default(8),
  /** Show the prev/next navigation arrows (slider layout only). */
  showArrows: z.boolean().default(true),
});

/** Live promotions (active + within their window), newest first. */
export const promotionsConfigSchema = z.object({
  title: z.string().default("Featured picks"),
  layout: z.enum(["grid", "slider"]).default("slider"),
  limit: z.coerce.number().int().min(1).max(12).default(8),
  /** Show the prev/next navigation arrows (slider layout only). */
  showArrows: z.boolean().default(true),
});

export const richCtaConfigSchema = z.object({
  heading: z.string().min(1, "Heading is required"),
  text: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaHref: z.string().default(""),
  tone: z.enum(["brand", "dark", "light"]).default("brand"),
});

/**
 * Free-form rich content authored in the builder's WYSIWYG editor. `html` is a
 * trusted HTML string produced by that editor (staff-only) and rendered inside
 * a scoped `.rich-text` prose style.
 */
export const richTextConfigSchema = z.object({
  html: z.string().default(""),
  /** Readable narrow column vs. full content width. */
  width: z.enum(["prose", "wide"]).default("prose"),
  align: z.enum(["left", "center"]).default("left"),
});

/**
 * A "reserve a table" widget. The branch list and per-branch availability come
 * live from settings (branches with reservations enabled), so this block only
 * stores presentation copy — never a hardcoded branch.
 */
export const reservationConfigSchema = z.object({
  title: z.string().default("Reserve a table"),
  subtitle: z.string().default("Pick a location and book your table in a few taps."),
  buttonLabel: z.string().default("Find a table"),
  tone: z.enum(["brand", "dark", "light"]).default("light"),
});

/**
 * An "enquire about an event" widget — birthdays, weddings, private parties.
 * Sends guests to the public event booking flow (`/events`); the bookable event
 * types come live from the admin catalogue, so this block only stores copy.
 */
export const eventsConfigSchema = z.object({
  title: z.string().default("Host your event with us"),
  subtitle: z
    .string()
    .default("Birthdays, weddings, private parties — tell us what you're planning."),
  buttonLabel: z.string().default("Plan an event"),
  tone: z.enum(["brand", "dark", "light"]).default("brand"),
});

/** Map of block type → its config schema. */
export const BLOCK_CONFIG_SCHEMAS = {
  hero: heroConfigSchema,
  "image-slider": imageSliderConfigSchema,
  promo: promoConfigSchema,
  "banner-slider": bannerSliderConfigSchema,
  "menu-grid": menuGridConfigSchema,
  "featured-categories": featuredCategoriesConfigSchema,
  "product-carousel": productCarouselConfigSchema,
  promotions: promotionsConfigSchema,
  "rich-cta": richCtaConfigSchema,
  "rich-text": richTextConfigSchema,
  reservation: reservationConfigSchema,
  events: eventsConfigSchema,
  "menu-slider": menuSliderConfigSchema,
} satisfies Record<BlockType, z.ZodTypeAny>;

// ── Block instance + page content ─────────────────────────────────────────

export const blockSchema = z.object({
  id: z.string(),
  type: z.preprocess(
    (v) => (typeof v === "string" && v in LEGACY_BLOCK_TYPES ? LEGACY_BLOCK_TYPES[v] : v),
    z.enum(BLOCK_TYPES),
  ),
  hidden: z.boolean().default(false),
  config: z.record(z.string(), z.unknown()),
});

export const headerConfigSchema = z.object({
  // Empty = fall back to the restaurant's real name (from tenant settings).
  brandName: z.string().default(""),
  showSearch: z.boolean().default(true),
  showLocation: z.boolean().default(true),
  ctaLabel: z.string().default("Order now"),
  ctaHref: z.string().default("/"),
  links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
});

export const footerConfigSchema = z.object({
  /** Optional footer logo image; falls back to the brand name text. */
  logoUrl: z.string().default(""),
  about: z.string().default(""),
  columns: z
    .array(
      z.object({
        heading: z.string(),
        links: z.array(z.object({ label: z.string(), href: z.string() })),
      }),
    )
    .default([]),
  socials: z.array(z.object({ platform: z.string(), href: z.string() })).default([]),
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
export type BannerSliderConfig = z.infer<typeof bannerSliderConfigSchema>;
export type MenuGridConfig = z.infer<typeof menuGridConfigSchema>;
export type MenuSliderConfig = z.infer<typeof menuSliderConfigSchema>;
export type FeaturedCategoriesConfig = z.infer<typeof featuredCategoriesConfigSchema>;
export type ProductCarouselConfig = z.infer<typeof productCarouselConfigSchema>;
export type PromotionsConfig = z.infer<typeof promotionsConfigSchema>;
export type RichCtaConfig = z.infer<typeof richCtaConfigSchema>;
export type RichTextConfig = z.infer<typeof richTextConfigSchema>;
export type ReservationConfig = z.infer<typeof reservationConfigSchema>;
export type EventsConfig = z.infer<typeof eventsConfigSchema>;

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
  return BLOCK_CONFIG_SCHEMAS[type].parse(raw ?? {}) as z.infer<(typeof BLOCK_CONFIG_SCHEMAS)[T]>;
}

/**
 * Tolerantly parse stored page content for the editor. A single malformed block
 * (e.g. an unknown/removed `type`) must NOT throw away the whole page — that
 * silently wipes the canvas and the next save persists the emptiness. Instead we
 * keep every block that parses and drop only the bad ones. Never throws.
 */
export function parsePageContentSafe(raw: unknown): PageContent {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const rawBlocks = Array.isArray(obj.blocks) ? obj.blocks : [];
  const blocks: Block[] = [];
  for (const rb of rawBlocks) {
    const parsed = blockSchema.safeParse(rb);
    if (parsed.success) blocks.push(parsed.data);
  }
  return {
    blocks,
    header: headerConfigSchema.parse(obj.header ?? {}),
    footer: footerConfigSchema.parse(obj.footer ?? {}),
  };
}
