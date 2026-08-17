/**
 * Branded reservation email — self-contained inline styles (email-client safe).
 * Sent to the guest on booking and on every status change, since guests book
 * without an account: this email is their only record + management link.
 */

export interface ReservationEmailBranding {
  companyName: string;
  primaryColor: string;
  logoUrl?: string;
  website?: string;
}

export interface ReservationEmailData {
  guestName: string;
  branchName: string;
  tableName?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  partySize: number;
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
        headline: 'Your table is confirmed',
        intro:
          'Great news — your reservation is confirmed. We look forward to hosting you.',
        badgeBg: '#dcfce7',
        badgeText: '#166534',
      };
    case 'seated':
      return {
        headline: "You're seated",
        intro: 'Enjoy your visit! Your table is ready.',
        badgeBg: '#e0f2fe',
        badgeText: '#075985',
      };
    case 'completed':
      return {
        headline: 'Thanks for dining with us',
        intro: 'We hope you had a wonderful time. See you again soon!',
        badgeBg: '#f1f5f9',
        badgeText: '#334155',
      };
    case 'cancelled':
      return {
        headline: 'Your reservation was cancelled',
        intro:
          "Your reservation has been cancelled. If this wasn't expected, please contact the restaurant.",
        badgeBg: '#fee2e2',
        badgeText: '#991b1b',
      };
    case 'no-show':
      return {
        headline: 'We missed you',
        intro:
          'Your reservation was marked as a no-show. Get in touch if you think this is a mistake.',
        badgeBg: '#fef3c7',
        badgeText: '#92400e',
      };
    default: // requested
      return {
        headline: 'Reservation received',
        intro:
          "Thanks for booking! We've received your reservation request and will confirm it shortly.",
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

export function reservationEmailTemplate(
  branding: ReservationEmailBranding,
  data: ReservationEmailData,
): string {
  const primary = branding.primaryColor || '#0f766e';
  const copy = statusCopy(data.status);
  const statusLabel =
    data.status.charAt(0).toUpperCase() + data.status.slice(1);

  const brandName = `<span style="font-size:20px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;vertical-align:middle;">${esc(branding.companyName)}</span>`;
  // Always show the brand name; pair it with the logo when one is configured.
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f4f6f8;">${esc(copy.headline)} · ${esc(data.branchName)} · ${formatDate(data.date)} at ${formatTime(data.time)}</div>

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

          <!-- Reservation details card -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb;border:1px solid #eef1f5;border-radius:12px;">
                <tr><td style="padding:16px 20px 4px 20px;">
                  <p style="margin:0 0 4px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;font-weight:600;">Reservation details</p>
                </td></tr>
                <tr><td style="padding:0 20px 12px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    ${detailRow('Restaurant', esc(data.branchName))}
                    ${detailRow('Date', formatDate(data.date))}
                    ${detailRow('Time', formatTime(data.time))}
                    ${detailRow('Party size', `${data.partySize} ${data.partySize === 1 ? 'guest' : 'guests'}`)}
                    ${data.tableName ? detailRow('Table', esc(data.tableName)) : ''}
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
                  <a href="${data.manageUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">View reservation</a>
                </td></tr>
              </table>
              <p style="margin:12px 0 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">${data.manageUrl}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 28px 32px;">
              <div style="height:1px;background-color:#eef1f5;margin:0 0 16px 0;line-height:1px;font-size:1px;">&nbsp;</div>
              <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">Keep this email as your booking record — no account needed. Use the link above anytime to view your reservation.</p>
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

/** Subject line for a reservation email. */
export function reservationEmailSubject(
  data: Pick<ReservationEmailData, 'status' | 'branchName' | 'date'>,
  isNew: boolean,
): string {
  if (isNew) return `Reservation received — ${data.branchName}`;
  const label = data.status.charAt(0).toUpperCase() + data.status.slice(1);
  return `Reservation ${label} — ${data.branchName}`;
}
