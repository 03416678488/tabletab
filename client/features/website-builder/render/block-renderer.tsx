import {
  CategoryGridRender,
  FeaturedCategoriesRender,
  ProductCarouselRender,
} from "@/features/website-builder/render/data-blocks";
import {
  HeroRender,
  ImageSliderRender,
  PromoRender,
  RichCtaRender,
} from "@/features/website-builder/render/static-blocks";
import {
  type Block,
  type BlockType,
  parseBlockConfig,
} from "@/features/website-builder/schemas/blocks";

/** Pure renderer per block type — shared by the editor preview and storefront. */
const RENDERERS: Record<BlockType, (config: never) => React.ReactNode> = {
  hero: (config) => <HeroRender config={config} />,
  "image-slider": (config) => <ImageSliderRender config={config} />,
  promo: (config) => <PromoRender config={config} />,
  "category-grid": (config) => <CategoryGridRender config={config} />,
  "featured-categories": (config) => <FeaturedCategoriesRender config={config} />,
  "product-carousel": (config) => <ProductCarouselRender config={config} />,
  "rich-cta": (config) => <RichCtaRender config={config} />,
};

/** Render a single block, coercing its stored config through the zod schema. */
export function BlockRenderer({ block }: { block: Block }) {
  const render = RENDERERS[block.type];
  if (!render) return null;
  let config: unknown;
  try {
    config = parseBlockConfig(block.type, block.config);
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
