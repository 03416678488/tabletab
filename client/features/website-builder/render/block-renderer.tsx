import {
  FeaturedCategoriesRender,
  MenuGridRender,
  MenuSliderRender,
  ProductCarouselRender,
  ReservationRender,
} from "@/features/website-builder/render/data-blocks";
import {
  BannerSliderRender,
  HeroRender,
  ImageSliderRender,
  PromoRender,
  RichCtaRender,
  RichTextRender,
} from "@/features/website-builder/render/static-blocks";
import {
  type Block,
  type BlockType,
  normalizeBlockType,
  parseBlockConfig,
} from "@/features/website-builder/schemas/blocks";

/** Pure renderer per block type — shared by the editor preview and storefront. */
const RENDERERS: Record<BlockType, (config: never) => React.ReactNode> = {
  hero: (config) => <HeroRender config={config} />,
  "image-slider": (config) => <ImageSliderRender config={config} />,
  "banner-slider": (config) => <BannerSliderRender config={config} />,
  promo: (config) => <PromoRender config={config} />,
  "menu-grid": (config) => <MenuGridRender config={config} />,
  "menu-slider": (config) => <MenuSliderRender config={config} />,
  "featured-categories": (config) => <FeaturedCategoriesRender config={config} />,
  "product-carousel": (config) => <ProductCarouselRender config={config} />,
  "rich-cta": (config) => <RichCtaRender config={config} />,
  "rich-text": (config) => <RichTextRender config={config} />,
  reservation: (config) => <ReservationRender config={config} />,
};

/** Render a single block, coercing its stored config through the zod schema. */
export function BlockRenderer({ block }: { block: Block }) {
  // Raw stored blocks may still carry a legacy type string (e.g. "category-grid").
  const type = normalizeBlockType(block.type);
  if (!type) return null;
  const render = RENDERERS[type];
  if (!render) return null;
  let config: unknown;
  try {
    config = parseBlockConfig(type, block.config);
  } catch {
    return null; // malformed config — skip rather than crash the page
  }
  return <>{(render as (c: unknown) => React.ReactNode)(config)}</>;
}

/** Render an ordered list of blocks, skipping hidden ones. */
export function BlockList({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks
        .filter((b) => !b.hidden)
        .map((b) => (
          <BlockRenderer key={b.id} block={b} />
        ))}
    </>
  );
}
