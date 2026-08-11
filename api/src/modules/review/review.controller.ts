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

import { Public } from '@modules/auth/guards/public/public.decorator';

import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto, GetReviewQueryDto } from './dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly _reviews: ReviewService) {}

  // Staff: the moderation queue (filter by status / item / branch).
  @Get()
  getAll(@Query() query: GetReviewQueryDto) {
    return this._reviews.getAll(query);
  }

  /**
   * Public — approved reviews for an item (storefront). Declared before `:id`
   * so `published` isn't captured as a review id.
   */
  @Public()
  @Get('published')
  published(@Query('menuItemId', ParseUUIDPipe) menuItemId: string) {
    return this._reviews.listPublished(menuItemId);
  }

  /** Public — an item's average rating + approved-review count. */
  @Public()
  @Get('summary')
  summary(@Query('menuItemId', ParseUUIDPipe) menuItemId: string) {
    return this._reviews.summary(menuItemId);
  }

  // Public so the storefront can submit a review (guest, no account required).
  @Public()
  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this._reviews.createReview(dto);
  }

  // Staff: fetch one (moderation detail).
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._reviews.getById(id);
  }

  // Staff: approve / reject.
  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReviewDto) {
    return this._reviews.moderate(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._reviews.deleteReview(id);
  }
}
