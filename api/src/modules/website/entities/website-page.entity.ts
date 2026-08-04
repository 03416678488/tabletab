import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** A block instance stored inside a page's content JSON. Config is per-type. */
export interface PageBlock {
  id: string;
  type: string;
  hidden: boolean;
  config: Record<string, unknown>;
}

/** The full editable content of a page: ordered blocks + chrome. */
export interface PageContent {
  blocks: PageBlock[];
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
}

/** Search-engine / social metadata for a page. */
export interface PageSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  noindex?: boolean;
}

@Entity('website_pages')
export class WebsitePage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable identifier used in URLs/lookups, e.g. "home". */
  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  title: string;

  /** Working draft — what the builder edits and saves. */
  @Column({ type: 'jsonb', default: () => `'{"blocks":[],"header":{},"footer":{}}'` })
  content: PageContent;

  /** Last published snapshot — what the storefront renders. Null until first publish. */
  @Column({ type: 'jsonb', nullable: true })
  published: PageContent | null;

  /** SEO / social metadata. */
  @Column({ type: 'jsonb', default: () => `'{}'` })
  seo: PageSeo;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
