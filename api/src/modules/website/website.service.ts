import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WebsitePage } from './entities/website-page.entity';
import {
  CreatePageDto,
  SaveDraftDto,
  UpdateGeneralDto,
  UpdateSeoDto,
} from './dto/website-page.dto';

export interface PageContentResponse {
  slug: string;
  title: string;
  content: WebsitePage['published'];
  seo: WebsitePage['seo'];
}

export interface PageSummary {
  id: string;
  slug: string;
  title: string;
  isHome: boolean;
  published: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
}

const HOME_SLUG = 'home';
const emptyContent = () => ({ blocks: [], header: {}, footer: {} });

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(WebsitePage)
    private readonly _repo: Repository<WebsitePage>,
  ) {}

  /** Listing — one row per page, newest-updated first (home pinned to top). */
  async list(): Promise<PageSummary[]> {
    const pages = await this._repo.find({ order: { updatedAt: 'DESC' } });
    return pages
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        isHome: p.slug === HOME_SLUG,
        published: Boolean(p.published),
        publishedAt: p.publishedAt,
        updatedAt: p.updatedAt,
      }))
      .sort((a, b) => Number(b.isHome) - Number(a.isHome));
  }

  async create(dto: CreatePageDto): Promise<WebsitePage> {
    const exists = await this._repo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('A page with this slug already exists');
    return this._repo.save(
      this._repo.create({
        slug: dto.slug,
        title: dto.title,
        content: emptyContent(),
        published: null,
        seo: {},
      }),
    );
  }

  /** Editor read — the page must exist (created via the listing, or seeded home). */
  async getPage(slug: string): Promise<WebsitePage> {
    const page = await this._repo.findOne({ where: { slug } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async saveDraft(slug: string, dto: SaveDraftDto): Promise<WebsitePage> {
    const page = await this.getPage(slug);
    page.content = dto.content;
    if (dto.title) page.title = dto.title;
    return this._repo.save(page);
  }

  /** General tab — rename / change slug. The home page's slug is protected. */
  async updateGeneral(slug: string, dto: UpdateGeneralDto): Promise<WebsitePage> {
    const page = await this.getPage(slug);
    if (dto.slug && dto.slug !== page.slug) {
      if (page.slug === HOME_SLUG) {
        throw new BadRequestException("The home page's URL can't be changed");
      }
      const clash = await this._repo.findOne({ where: { slug: dto.slug } });
      if (clash) throw new ConflictException('A page with this slug already exists');
      page.slug = dto.slug;
    }
    if (dto.title) page.title = dto.title;
    return this._repo.save(page);
  }

  async updateSeo(slug: string, dto: UpdateSeoDto): Promise<WebsitePage> {
    const page = await this.getPage(slug);
    page.seo = { ...page.seo, ...dto };
    return this._repo.save(page);
  }

  async remove(slug: string): Promise<{ message: string }> {
    const page = await this.getPage(slug);
    if (page.slug === HOME_SLUG) {
      throw new BadRequestException("The home page can't be deleted");
    }
    await this._repo.delete(page.id);
    return { message: 'Page deleted' };
  }

  /** Copy the working draft into the published snapshot the storefront reads. */
  async publish(slug: string): Promise<WebsitePage> {
    const page = await this.getPage(slug);
    page.published = page.content;
    page.publishedAt = new Date();
    return this._repo.save(page);
  }

  /** Public storefront read — published content only (null if never published). */
  async getPublished(slug: string): Promise<PageContentResponse> {
    const page = await this._repo.findOne({ where: { slug } });
    if (!page) throw new NotFoundException('Page not found');
    return {
      slug: page.slug,
      title: page.title,
      content: page.published,
      seo: page.seo ?? {},
    };
  }
}
