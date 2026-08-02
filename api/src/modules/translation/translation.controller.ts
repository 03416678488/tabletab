import { Body, Controller, Get, Put, Query } from '@nestjs/common';

import { Public } from '@modules/auth/guards/public/public.decorator';

import { TranslationService } from './translation.service';
import { SaveTranslationsDto } from './dto/translation.dto';

@Controller('translations')
export class TranslationController {
  constructor(private readonly _service: TranslationService) {}

  /** Translations for one record: /translations?entity=tax&entityId=3 */
  @Public()
  @Get()
  getFor(@Query('entity') entity: string, @Query('entityId') entityId: string) {
    return this._service.getFor(entity, entityId);
  }

  @Put()
  save(@Body() dto: SaveTranslationsDto) {
    return this._service.save(dto);
  }
}
