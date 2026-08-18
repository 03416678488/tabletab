/**
 * Branded event-booking email — self-contained inline styles (email-client safe).
 * Sent to the guest on booking and on every status change, since guests book
 * without an account: this email is their only record + management link.
 */

export interface EventEmailBranding {
  companyName: string;
  primaryColor: string;
  logoUrl?: string;
  website?: string;
}

export interface EventEmailData {
  guestName: string;
  branchName: string;
  eventTypeName?: string | null;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string | null; // HH:mm
  guestCount: number;
  status: string;
  specialRequests?: string | null;
  manageUrl: string;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DAYS[dt.getUTCDay()]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

function formatTime(hhmm: string): string {
  const [h, min] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(min || 0).padStart(2, '0')} ${period}`;
}

/** Status → guest-facing headline + intro line + badge colour. */
function statusCopy(status: string): {
  headline: string;
  intro: string;
  badgeBg: string;
  badgeText: string;
} {
  switch (status) {
    case 'confirmed':
      return {
        headline: 'Your event is confirmed',
        intro:
          "Great news — your event booking is confirmed. We can't wait to host you!",
        badgeBg: '#dcfce7',
        badgeText: '#166534',
      };
    case 'completed':
      return {
        headline: 'Thanks for celebrating with us',
        intro:
          'We hope your event was everything you hoped for. See you again soon!',
        badgeBg: '#f1f5f9',
        badgeText: '#334155',
      };
    case 'cancelled':
      return {
        headline: 'Your event booking was cancelled',
        intro:
          "Your event booking has been cancelled. If this wasn't expected, please contact us.",
        badgeBg: '#fee2e2',
        badgeText: '#991b1b',
      };
    default: // requested
      return {
        headline: 'Event request received',
        intro:
          "Thanks for your enquiry! We've received your event request and will be in touch shortly to confirm the details.",
        badgeBg: '#fef3c7',
        badgeText: '#92400e',
      };
  }
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#6b7280;width:120px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${value}</td>
    </tr>`;
}

export function eventEmailTemplate(
  branding: EventEmailBranding,
  data: EventEmailData,
): string {
  const primary = branding.primaryColor || '#0f766e';
  const copy = statusCopy(data.status);
  const statusLabel =
    data.status.charAt(0).toUpperCase() + data.status.slice(1);
  const timeRange = data.endTime
    ? `${formatTime(data.startTime)} – ${formatTime(data.endTime)}`
    : formatTime(data.startTime);

  const brandName = `<span style="font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;vertical-align:middle;">${esc(branding.companyName)}</span>`;
  const header = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="" height="32" style="height:32px;max-height:32px;vertical-align:middle;margin-right:10px;" />${brandName}`
    : brandName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${esc(copy.headline)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f4f6f8;">${esc(copy.headline)} · ${esc(data.title)} · ${formatDate(data.date)}</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6f8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:560px;max-width:560px;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

          <!-- Brand header -->
          <tr>
            <td style="padding:24px 32px;background-color:${primary};">
              ${header}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <span style="display:inline-block;padding:4px 12px;border-radius:999px;background-color:${copy.badgeBg};color:${copy.badgeText};font-size:12px;font-weight:600;">${statusLabel}</span>
              <h1 style="margin:16px 0 8px 0;font-size:22px;font-weight:700;color:#111827;">${esc(copy.headline)}</h1>
              <p style="margin:0 0 4px 0;font-size:15px;color:#374151;">Hi ${esc(data.guestName)},</p>
              <p style="margin:8px 0 24px 0;font-size:14px;line-height:1.6;color:#4b5563;">${copy.intro}</p>
            </td>
          </tr>

          <!-- Event details card -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb;border:1px solid #eef1f5;border-radius:12px;">
                <tr><td style="padding:16px 20px 4px 20px;">
                  <p style="margin:0 0 4px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;font-weight:600;">Event details</p>
                </td></tr>
                <tr><td style="padding:0 20px 12px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    ${detailRow('Event', esc(data.title))}
                    ${data.eventTypeName ? detailRow('Type', esc(data.eventTypeName)) : ''}
                    ${detailRow('Location', esc(data.branchName))}
                    ${detailRow('Date', formatDate(data.date))}
                    ${detailRow('Time', timeRange)}
                    ${detailRow('Guests', `${data.guestCount} ${data.guestCount === 1 ? 'guest' : 'guests'}`)}
                    ${data.specialRequests ? detailRow('Requests', esc(data.specialRequests)) : ''}
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 8px 32px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="border-radius:10px;background-color:${primary};">
                  <a href="${data.manageUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">View booking</a>
                </td></tr>
              </table>
              <p style="margin:12px 0 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">${data.manageUrl}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 28px 32px;">
              <div style="height:1px;background-color:#eef1f5;margin:0 0 16px 0;line-height:1px;font-size:1px;">&nbsp;</div>
              <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">Keep this email as your booking record — no account needed. Use the link above anytime to view your event.</p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} ${esc(branding.companyName)}${branding.website ? ` · <a href="${branding.website}" style="color:#9ca3af;text-decoration:none;">${esc(branding.website.replace(/^https?:\/\//, ''))}</a>` : ''}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Subject line for an event-booking email. */
export function eventEmailSubject(
  data: Pick<EventEmailData, 'status' | 'title'>,
  isNew: boolean,
): string {
  if (isNew) return `Event request received — ${data.title}`;
  const label = data.status.charAt(0).toUpperCase() + data.status.slice(1);
  return `Event booking ${label} — ${data.title}`;
}
