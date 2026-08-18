import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { RequirePermission } from '@cor/decorators/authorization/require-permission.decorator';

import { Public } from '@modules/auth/guards/public/public.decorator';
import { SettingService } from '@modules/setting/setting.service';
import { FX_PROVIDERS } from '@services/exchange-rate';

import { CurrencyService } from './currency.service';
import { CurrencyRatesService, FX_FREQUENCIES } from './currency-rates.service';
import {
  CreateCurrencyDto,
  UpdateCurrencyDto,
  UpdateFxSettingsDto,
} from './dto/currency.dto';

@RequirePermission('settings')
@Controller('currencies')
export class CurrencyController {
  constructor(
    private readonly _service: CurrencyService,
    private readonly _rates: CurrencyRatesService,
    private readonly _settings: SettingService,
  ) {}

  @Public()
  @Get()
  getAll() {
    return this._service.getAll();
  }

  /** FX auto-sync config + catalogs for the admin UI. */
  @Get('fx-settings')
  async getFxSettings() {
    const [settings, site, fx] = await Promise.all([
      this._rates.getSettings(),
      this._settings.getGroup('site'),
      this._settings.getGroup('fx'),
    ]);
    return {
      ...settings,
      providers: FX_PROVIDERS,
      frequencies: FX_FREQUENCIES.map(({ value, label }) => ({ value, label })),
      syncedAt: site.currency_rates_synced_at || '',
      lastProvider: fx.last_provider || '',
    };
  }

  /** Save provider / key / frequency and re-arm the schedule. */
  @Put('fx-settings')
  updateFxSettings(@Body() dto: UpdateFxSettingsDto) {
    return this._rates.saveSettings(dto);
  }

  /** Manual "Sync rates now" — pulls latest FX from the configured provider. */
  @Post('sync')
  sync() {
    return this._rates.syncRates();
  }

  @Post()
  create(@Body() dto: CreateCurrencyDto) {
    return this._service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCurrencyDto,
  ) {
    return this._service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this._service.remove(id);
  }
}
