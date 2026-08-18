import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from '@modules/mail/mail.service';
import { SettingService } from '@modules/setting/setting.service';
import {
  eventEmailSubject,
  eventEmailTemplate,
} from '@modules/mail/templates/event.template';

import { Event } from '../entities/event.entity';

/**
 * Emails the guest their event booking on submission and on every status change.
 * Guests book without an account, so this email (with its management link) is
 * their only record. Best-effort: never blocks or fails the booking.
 */
@Injectable()
export class EventMailService {
  constructor(
    private readonly _mail: MailService,
    private readonly _settings: SettingService,
    private readonly _config: ConfigService,
  ) {}

  async notify(event: Event, isNew: boolean): Promise<void> {
    if (!event.guestEmail) return;

    try {
      const groups = await this._settings.getGrouped(['company', 'theme']);
      const company = groups.company ?? {};
      const theme = groups.theme ?? {};

      const frontendUrl =
        this._config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const manageUrl = `${frontendUrl.replace(/\/$/, '')}/events/confirm/${event.id}`;

      const data = {
        guestName: event.guestName,
        branchName: event.branch?.name ?? 'our venue',
        eventTypeName: event.eventType?.name ?? null,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        guestCount: event.guestCount,
        status: event.status,
        specialRequests: event.specialRequests,
        manageUrl,
      };

      const html = eventEmailTemplate(
        {
          companyName: company.name || 'TableTab',
          primaryColor: theme.primary_color || '#0f766e',
          logoUrl: theme.logo || undefined,
          website: company.website || undefined,
        },
        data,
      );

      await this._mail.sendCustomEmail(
        event.guestEmail,
        eventEmailSubject(data, isNew),
        html,
      );
    } catch (err) {
      console.warn('[event] guest email failed', (err as Error).message);
    }
  }
}
