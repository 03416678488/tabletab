import { Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { CustomerAuthService } from './customer-auth.service';
import { CustomerFavoritesService } from './customer-favorites.service';

/**
 * Storefront favorites. `@Public()` like the rest of the customer surface — the
 * bearer token is verified in-service and identifies the customer. Every route
 * returns the full up-to-date id list so the client can reconcile optimistically.
 */
@Controller('customer-favorites')
export class CustomerFavoritesController {
  constructor(
    private readonly _favorites: CustomerFavoritesService,
    private readonly _auth: CustomerAuthService,
  ) {}

  @Public()
  @Get()
  async list(@Headers('authorization') authorization?: string) {
    const customerId = this._auth.verifyCustomerId(authorization);
    return { itemIds: await this._favorites.listItemIds(customerId) };
  }

  @Public()
  @Post(':menuItemId')
  async add(
    @Param('menuItemId') menuItemId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const customerId = this._auth.verifyCustomerId(authorization);
    await this._favorites.add(customerId, menuItemId);
    return { itemIds: await this._favorites.listItemIds(customerId) };
  }

  @Public()
  @Delete(':menuItemId')
  async remove(
    @Param('menuItemId') menuItemId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const customerId = this._auth.verifyCustomerId(authorization);
    await this._favorites.remove(customerId, menuItemId);
    return { itemIds: await this._favorites.listItemIds(customerId) };
  }
}
