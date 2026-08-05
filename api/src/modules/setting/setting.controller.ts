import { Body, Controller, Get, Param, Put } from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { SettingService } from './setting.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingController {
  constructor(private readonly _service: SettingService) {}

  /** Public display settings (company, site, social, theme) — loaded by every client. */
  @Public()
  @Get()
  getPublic() {
    return this._service.getPublic();
  }

  /** All setting groups — for the admin settings screens. */
  @Get('all')
  getAll() {
    return this._service.getGrouped();
  }

  /** Public — enabled payment methods for the storefront checkout (no secrets).
      Declared before `:group` so the static segment isn't captured as a group. */
  @Public()
  @Get('payment-methods')
  getPaymentMethods() {
    return this._service.getPaymentMethods();
  }

  @Get(':group')
  getGroup(@Param('group') group: string) {
    return this._service.getGroup(group);
  }

  @Put(':group')
  saveGroup(@Param('group') group: string, @Body() dto: UpdateSettingsDto) {
    return this._service.saveGroup(group, dto.values);
  }
}
