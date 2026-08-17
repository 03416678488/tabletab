import {
  BannerSliderConfigForm,
  type ConfigFormProps,
  FeaturedCategoriesConfigForm,
  HeroConfigForm,
  ImageSliderConfigForm,
  MenuGridConfigForm,
  MenuSliderConfigForm,
  ProductCarouselConfigForm,
  PromoConfigForm,
  PromotionsConfigForm,
  ReservationConfigForm,
  EventsConfigForm,
  RichCtaConfigForm,
  RichTextConfigForm,
} from "@/features/website-builder/components/config-forms";
import { BLOCK_META, type BlockMeta } from "@/features/website-builder/constants/blocks";
import type { BlockType } from "@/features/website-builder/schemas/blocks";

export interface BlockRegistryEntry extends BlockMeta {
  ConfigForm: (props: ConfigFormProps) => React.ReactNode;
}

/** Editor-only registry: block metadata + its config form. */
export const BLOCK_REGISTRY: Record<BlockType, BlockRegistryEntry> = {
  hero: { ...BLOCK_META.hero, ConfigForm: HeroConfigForm },
  "image-slider": { ...BLOCK_META["image-slider"], ConfigForm: ImageSliderConfigForm },
  "banner-slider": { ...BLOCK_META["banner-slider"], ConfigForm: BannerSliderConfigForm },
  promo: { ...BLOCK_META.promo, ConfigForm: PromoConfigForm },
  "menu-grid": { ...BLOCK_META["menu-grid"], ConfigForm: MenuGridConfigForm },
  "menu-slider": { ...BLOCK_META["menu-slider"], ConfigForm: MenuSliderConfigForm },
  "featured-categories": {
    ...BLOCK_META["featured-categories"],
    ConfigForm: FeaturedCategoriesConfigForm,
  },
  "product-carousel": { ...BLOCK_META["product-carousel"], ConfigForm: ProductCarouselConfigForm },
  promotions: { ...BLOCK_META.promotions, ConfigForm: PromotionsConfigForm },
  "rich-cta": { ...BLOCK_META["rich-cta"], ConfigForm: RichCtaConfigForm },
  "rich-text": { ...BLOCK_META["rich-text"], ConfigForm: RichTextConfigForm },
  reservation: { ...BLOCK_META.reservation, ConfigForm: ReservationConfigForm },
  events: { ...BLOCK_META.events, ConfigForm: EventsConfigForm },
};
