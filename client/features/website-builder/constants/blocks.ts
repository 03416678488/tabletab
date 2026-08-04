import {
  Columns2,
  Images,
  LayoutList,
  type LucideIcon,
  Megaphone,
  MousePointerClick,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import type {
  BannerSliderConfig,
  BlockType,
  FeaturedCategoriesConfig,
  HeroConfig,
  ImageSliderConfig,
  MenuGridConfig,
  ProductCarouselConfig,
  PromoConfig,
  RichCtaConfig,
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
  ctaHref: "/order",
  align: "center",
};

const imageSliderDefault: ImageSliderConfig = {
  title: "Highlights",
  autoplay: true,
  autoplaySeconds: 4,
  perView: 1,
  images: [
    { url: stock("1513104890138-7c749659a591"), caption: "Weekend brunch", href: "/order", badge: "" },
    { url: stock("1517248135467-4c7edcad34c4"), caption: "Chef's specials", href: "/order", badge: "10% Off" },
    { url: stock("1526367790999-0150786686a2"), caption: "Free delivery", href: "/order", badge: "" },
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
      href: "/order",
      imageUrl: stock("1526367790999-0150786686a2"),
    },
    {
      eyebrow: "This week",
      title: "Chef's specials · 20% off",
      subtitle: "Handpicked plates, limited time",
      cta: "Explore",
      href: "/order",
      imageUrl: stock("1517248135467-4c7edcad34c4"),
    },
    {
      eyebrow: "Save more",
      title: "Family bundles",
      subtitle: "Feed everyone for less",
      cta: "See bundles",
      href: "/order",
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
  ctaHref: "/order",
  tone: "brand",
  bannerImage: "",
  autoplay: true,
  autoplaySeconds: 4,
  perView: 1,
  images: [
    { url: stock("1504674900247-0877df9cc836", 800, 600), caption: "", href: "/order", badge: "" },
    { url: stock("1517248135467-4c7edcad34c4", 800, 600), caption: "", href: "/order", badge: "" },
    { url: stock("1526367790999-0150786686a2", 800, 600), caption: "", href: "/order", badge: "" },
  ],
};

const menuGridDefault: MenuGridConfig = {
  title: "Our menus",
  menuIds: [],
  layout: "grid",
  limit: 8,
  showViewAll: true,
};

const productCarouselDefault: ProductCarouselConfig = {
  title: "Popular right now",
  itemIds: [],
  layout: "slider",
  limit: 8,
};

const richCtaDefault: RichCtaConfig = {
  heading: "Hungry? We've got you.",
  text: "Browse the full menu and get your order started.",
  ctaLabel: "See the menu",
  ctaHref: "/order",
  tone: "brand",
};

const featuredCategoriesDefault: FeaturedCategoriesConfig = {
  title: "Order by category",
  categoryIds: [],
  layout: "slider",
  limit: 8,
  showViewAll: true,
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
  "featured-categories": {
    type: "featured-categories",
    label: "Featured categories",
    description: "Pick categories to feature — each shows its live products.",
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
  "rich-cta": {
    type: "rich-cta",
    label: "Call to action",
    description: "A coloured band with a heading and button.",
    icon: MousePointerClick,
    defaultConfig: richCtaDefault,
  },
};

/** Palette order — how block types are offered in the "Add block" menu. */
export const BLOCK_PALETTE: BlockType[] = [
  "hero",
  "image-slider",
  "banner-slider",
  "promo",
  "menu-grid",
  "featured-categories",
  "product-carousel",
  "rich-cta",
];
