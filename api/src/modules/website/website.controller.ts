import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { WebsiteService } from './website.service';
import {
  CreatePageDto,
  SaveDraftDto,
  UpdateGeneralDto,
  UpdateSeoDto,
} from './dto/website-page.dto';

@Controller('website')
export class WebsiteController {
  constructor(private readonly _service: WebsiteService) {}

  /** Public — the storefront renders the published snapshot. */
  @Public()
  @Get('published/:slug')
  getPublished(@Param('slug') slug: string) {
    return this._service.getPublished(slug);
  }

  @Get('pages')
  list() {
    return this._service.list();
  }

  @Post('pages')
  create(@Body() dto: CreatePageDto) {
    return this._service.create(dto);
  }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this._service.getPage(slug);
  }

  @Put('pages/:slug/draft')
  saveDraft(@Param('slug') slug: string, @Body() dto: SaveDraftDto) {
    return this._service.saveDraft(slug, dto);
  }

  @Put('pages/:slug/general')
  updateGeneral(@Param('slug') slug: string, @Body() dto: UpdateGeneralDto) {
    return this._service.updateGeneral(slug, dto);
  }

  @Put('pages/:slug/seo')
  updateSeo(@Param('slug') slug: string, @Body() dto: UpdateSeoDto) {
    return this._service.updateSeo(slug, dto);
  }

  @Post('pages/:slug/publish')
  publish(@Param('slug') slug: string) {
    return this._service.publish(slug);
  }

  @Delete('pages/:slug')
  remove(@Param('slug') slug: string) {
    return this._service.remove(slug);
  }
}
