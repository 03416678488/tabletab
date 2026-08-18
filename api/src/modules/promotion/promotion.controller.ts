import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { PromotionService } from './promotion.service';
import {
  CreatePromotionDto,
  GetPromotionQueryDto,
  UpdatePromotionDto,
  ValidatePromotionDto,
} from './dto';

@RequirePermission('promotions')
@Controller('promotions')
export class PromotionController {
  constructor(private readonly _promotionService: PromotionService) {}

  // ── Public (declared before the `:id` route) ────────────────────────────────

  /** Live promotion's for storefront sliders / block pickers. */
  @Public()
  @Get('active')
  getActive() {
    return this._promotionService.getActive();
  }

  /** Validate a promo code at checkout. */
  @Public()
  @Post('validate')
  validate(@Body() dto: ValidatePromotionDto) {
    return this._promotionService.validateCode(dto);
  }

  /** The storefront promotion landing page (`/promotion/{slug}`). */
  @Public()
  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this._promotionService.getBySlug(slug);
  }

  // ── Admin (staff-only via the global guard) ─────────────────────────────────

  @Get()
  getAll(@Query() query: GetPromotionQueryDto) {
    return this._promotionService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._promotionService.getById(id);
  }

  @Post()
  create(@Body() dto: CreatePromotionDto) {
    return this._promotionService.createPromotion(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this._promotionService.updatePromotion(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this._promotionService.deletePromotion(id);
  }
}
