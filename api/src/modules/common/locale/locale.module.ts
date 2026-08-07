import { Module } from '@nestjs/common';

import { SettingModule } from '@modules/setting/setting.module';

import { LocaleContext } from './locale-context.service';

/**
 * Provides the request-scoped {@link LocaleContext}. Import this module wherever
 * a service needs the caller's active language, then inject `LocaleContext`.
 */
@Module({
  imports: [SettingModule],
  providers: [LocaleContext],
  exports: [LocaleContext],
})
export class LocaleModule {}
