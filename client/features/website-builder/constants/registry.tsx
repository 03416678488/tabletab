import {
  CategoryGridConfigForm,
  type ConfigFormProps,
  FeaturedCategoriesConfigForm,
  HeroConfigForm,
  ImageSliderConfigForm,
  ProductCarouselConfigForm,
  PromoConfigForm,
  RichCtaConfigForm,
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
  promo: { ...BLOCK_META.promo, ConfigForm: PromoConfigForm },
  "category-grid": { ...BLOCK_META["category-grid"], ConfigForm: CategoryGridConfigForm },
  "featured-categories": {
    ...BLOCK_META["featured-categories"],
    ConfigForm: FeaturedCategoriesConfigForm,
  },
  "product-carousel": { ...BLOCK_META["product-carousel"], ConfigForm: ProductCarouselConfigForm },
  "rich-cta": { ...BLOCK_META["rich-cta"], ConfigForm: RichCtaConfigForm },
};
