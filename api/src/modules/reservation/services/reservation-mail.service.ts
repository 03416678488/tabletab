import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from '@modules/mail/mail.service';
import { SettingService } from '@modules/setting/setting.service';
import {
  reservationEmailSubject,
  reservationEmailTemplate,
} from '@modules/mail/templates/reservation.template';

import { Reservation } from '../entities/reservation.entity';

/**
 * Emails the guest their reservation details on booking and on every status
 * change. Guests book without an account, so this email (with its management
 * link) is their only record. Best-effort: never blocks or fails the booking.
 */
@Injectable()
export class ReservationMailService {
  constructor(
    private readonly _mail: MailService,
    private readonly _settings: SettingService,
    private readonly _config: ConfigService,
  ) {}

  async notify(reservation: Reservation, isNew: boolean): Promise<void> {
    if (!reservation.guestEmail) return;

    try {
      const groups = await this._settings.getGrouped(['company', 'theme']);
      const company = groups.company ?? {};
      const theme = groups.theme ?? {};

      const frontendUrl =
        this._config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const manageUrl = `${frontendUrl.replace(/\/$/, '')}/reserve/confirm/${reservation.id}`;

      const data = {
        guestName: reservation.guestName,
        branchName: reservation.branch?.name ?? 'our restaurant',
        tableName: reservation.table?.name ?? null,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        status: reservation.status,
        specialRequests: reservation.specialRequests,
        manageUrl,
      };

      const html = reservationEmailTemplate(
        {
          companyName: company.name || 'TableTab',
          primaryColor: theme.primary_color || '#0f766e',
          logoUrl: theme.logo || undefined,
          website: company.website || undefined,
        },
        data,
      );

      await this._mail.sendCustomEmail(
        reservation.guestEmail,
        reservationEmailSubject(data, isNew),
        html,
      );
    } catch (err) {
      console.warn('[reservation] guest email failed', (err as Error).message);
    }
  }
}
