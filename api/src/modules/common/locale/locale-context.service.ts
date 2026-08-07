import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { SettingService } from '@modules/setting/setting.service';

/**
 * Request-scoped access to the caller's active language, so services read the
 * locale from one place instead of threading a `lang` parameter through every
 * method (mirrors how the tenant lives on the request).
 *
 * The client sends the active locale's language via the `x-lang` header (set by
 * the frontend from the locale cookie). `defaultLanguage` comes from the tenant's
 * settings — the language the base rows are authored in — so `isTranslated()` can
 * decide whether reads overlay translations and writes target a translation table.
 */
@Injectable({ scope: Scope.REQUEST })
export class LocaleContext {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly settings: SettingService,
  ) {}

  /** Active language code for this request (e.g. `ar`); `''` when none was sent. */
  get language(): string {
    const header = this.request?.headers?.['x-lang'];
    const raw = Array.isArray(header) ? header[0] : header ?? '';
    return raw.split('-')[0].trim().toLowerCase();
  }

  /** The tenant's default (source) language — the language of the base rows. */
  async defaultLanguage(): Promise<string> {
    const site = await this.settings.getGroup('site');
    return (site.default_language || 'en').toLowerCase();
  }

  /**
   * Whether the active language is a non-default language — i.e. reads should
   * overlay translations and writes should target the translation table. `false`
   * when no language was sent or it matches the tenant default.
   */
  async isTranslated(): Promise<boolean> {
    const lang = this.language;
    return !!lang && lang !== (await this.defaultLanguage());
  }
}
