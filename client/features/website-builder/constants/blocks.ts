import {
  BadgePercent,
  CalendarCheck,
  Columns2,
  GalleryHorizontalEnd,
  Images,
  LayoutList,
  type LucideIcon,
  Megaphone,
  MousePointerClick,
  ShoppingBag,
  Sparkles,
  Type,
  UtensilsCrossed,
} from "lucide-react";

import type {
  BannerSliderConfig,
  BlockType,
  FeaturedCategoriesConfig,
  HeroConfig,
  ImageSliderConfig,
  MenuGridConfig,
  MenuSliderConfig,
  ProductCarouselConfig,
  PromoConfig,
  PromotionsConfig,
  ReservationConfig,
  RichCtaConfig,
  RichTextConfig,
} from "@/features/website-builder/schemas/blocks";

export interface BlockMeta {
  type: BlockType;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Fresh config for a newly-added block of this type. */
  defaultConfig: Record<string, unknown>;
}

const stock = (seed: string, w = 1000, h = 560) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

const heroDefault: HeroConfig = {
  title: "Fresh food, delivered fast",
  subtitle: "Order from your favourite local kitchen in a few taps.",
  imageUrl: stock("1504674900247-0877df9cc836", 1600, 800),
  ctaLabel: "Order now",
  ctaHref: "/",
  align: "center",
};

const imageSliderDefault: ImageSliderConfig = {
  title: "Highlights",
  autoplay: true,
  autoplaySeconds: 4,
  perView: 1,
  showArrows: true,
  images: [
    { url: stock("1513104890138-7c749659a591"), caption: "Weekend brunch", href: "/", badge: "" },
    {
      url: stock("1517248135467-4c7edcad34c4"),
      caption: "Chef's specials",
      href: "/",
      badge: "10% Off",
    },
    { url: stock("1526367790999-0150786686a2"), caption: "Free delivery", href: "/", badge: "" },
  ],
};

const promoDefault: PromoConfig = {
  variant: "triple",
  banners: [
    {
      eyebrow: "Limited time",
      title: "Free delivery",
      subtitle: "On your first order over $25",
      cta: "Order now",
      href: "/",
      imageUrl: stock("1526367790999-0150786686a2"),
    },
    {
      eyebrow: "This week",
      title: "Chef's specials · 20% off",
      subtitle: "Handpicked plates, limited time",
      cta: "Explore",
      href: "/",
      imageUrl: stock("1517248135467-4c7edcad34c4"),
    },
    {
      eyebrow: "Save more",
      title: "Family bundles",
      subtitle: "Feed everyone for less",
      cta: "See bundles",
      href: "/",
      imageUrl: stock("1504674900247-0877df9cc836"),
    },
  ],
};

const bannerSliderDefault: BannerSliderConfig = {
  bannerSide: "left",
  eyebrow: "Today's special",
  title: "Fresh from the kitchen",
  subtitle: "Handpicked plates, made to order — see what's cooking this week.",
  ctaLabel: "Order now",
  ctaHref: "/",
  tone: "brand",
  bannerImage: "",
  autoplay: true,
  autoplaySeconds: 4,
  perView: 1,
  showArrows: true,
  images: [
    { url: stock("1504674900247-0877df9cc836", 800, 600), caption: "", href: "/", badge: "" },
    { url: stock("1517248135467-4c7edcad34c4", 800, 600), caption: "", href: "/", badge: "" },
    { url: stock("1526367790999-0150786686a2", 800, 600), caption: "", href: "/", badge: "" },
  ],
};

const menuGridDefault: MenuGridConfig = {
  title: "Our menus",
  layout: "grid",
  limit: 8,
  showViewAll: true,
  showArrows: true,
};

const menuSliderDefault: MenuSliderConfig = {
  title: "Explore our menus",
  showArrows: true,
};

const productCarouselDefault: ProductCarouselConfig = {
  title: "Popular right now",
  itemIds: [],
  layout: "slider",
  limit: 8,
  showArrows: true,
};

const promotionsDefault: PromotionsConfig = {
  title: "Featured picks",
  layout: "slider",
  limit: 8,
  showArrows: true,
};

const richCtaDefault: RichCtaConfig = {
  heading: "Hungry? We've got you.",
  text: "Browse the full menu and get your order started.",
  ctaLabel: "See the menu",
  ctaHref: "/",
  tone: "brand",
};

const featuredCategoriesDefault: FeaturedCategoriesConfig = {
  title: "Order by category",
  layout: "slider",
  limit: 8,
  showViewAll: true,
  showArrows: true,
};

const richTextDefault: RichTextConfig = {
  html: "<h2>About us</h2><p>Tell your story here — add headings, formatted text, links, and images. Use the toolbar to style everything, just like a document.</p>",
  width: "prose",
  align: "left",
};

const reservationDefault: ReservationConfig = {
  title: "Reserve a table",
  subtitle: "Pick a location and book your table in a few taps.",
  buttonLabel: "Find a table",
  tone: "light",
};

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  hero: {
    type: "hero",
    label: "Hero banner",
    description: "Full-width headline with image and call-to-action.",
    icon: Sparkles,
    defaultConfig: heroDefault,
  },
  "image-slider": {
    type: "image-slider",
    label: "Image slider",
    description: "Auto-playing carousel of images (great for 3-image sliders).",
    icon: Images,
    defaultConfig: imageSliderDefault,
  },
  "banner-slider": {
    type: "banner-slider",
    label: "Banner + slider",
    description: "A promo banner on one side and an image slider on the other.",
    icon: Columns2,
    defaultConfig: bannerSliderDefault,
  },
  promo: {
    type: "promo",
    label: "Promo banners",
    description: "One, two, or three promotional cards in a row.",
    icon: Megaphone,
    defaultConfig: promoDefault,
  },
  "menu-grid": {
    type: "menu-grid",
    label: "Menu grid",
    description: "Your menus — each rendered as a section of its dishes.",
    icon: UtensilsCrossed,
    defaultConfig: menuGridDefault,
  },
  "menu-slider": {
    type: "menu-slider",
    label: "Menu slider",
    description: "Your menus as image cards in a slider — all or hand-picked.",
    icon: GalleryHorizontalEnd,
    defaultConfig: menuSliderDefault,
  },
  "featured-categories": {
    type: "featured-categories",
    label: "Category slider",
    description: "Every category for the selected branch, each with its live products.",
    icon: LayoutList,
    defaultConfig: featuredCategoriesDefault,
  },
  "product-carousel": {
    type: "product-carousel",
    label: "Product cards",
    description: "Menu items as cards — grid or slider.",
    icon: ShoppingBag,
    defaultConfig: productCarouselDefault,
  },
  promotions: {
    type: "promotions",
    label: "Promotions",
    description: "Live promotions as cards — grid or slider.",
    icon: BadgePercent,
    defaultConfig: promotionsDefault,
  },
  "rich-cta": {
    type: "rich-cta",
    label: "Call to action",
    description: "A coloured band with a heading and button.",
    icon: MousePointerClick,
    defaultConfig: richCtaDefault,
  },
  "rich-text": {
    type: "rich-text",
    label: "Text & images",
    description: "A rich text editor — headings, formatting, links and images.",
    icon: Type,
    defaultConfig: richTextDefault,
  },
  reservation: {
    type: "reservation",
    label: "Reservation",
    description: "Book-a-table widget — branches come live from your settings.",
    icon: CalendarCheck,
    defaultConfig: reservationDefault,
  },
};

/** Palette order — how block types are offered in the "Add block" menu. */
export const BLOCK_PALETTE: BlockType[] = [
  "hero",
  "image-slider",
  "banner-slider",
  "promo",
  "menu-grid",
  "menu-slider",
  "featured-categories",
  "product-carousel",
  "rich-text",
  "reservation",
  "rich-cta",
];
