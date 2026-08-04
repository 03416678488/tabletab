type BaseLayoutOptions = {
  title: string;
  preheader?: string;
  body: string;
  appUrl: string;
  footerNote: string;
};

/**
 * Shared chrome for every SniffCampaign email.
 *
 * Email clients (especially Outlook, Yahoo) ignore <style> blocks selectively
 * and don't support CSS variables or modern selectors. So inline beats clever:
 * every visual decision lives directly on the element.
 */
export function baseLayout({
  title,
  preheader,
  body,
  appUrl,
  footerNote,
}: BaseLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; }

    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f7f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d2433;">

  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f7f9fb;">${preheader}</div>` : ''}

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f9fb;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" class="container" width="560" cellspacing="0" cellpadding="0" border="0" style="width:560px;max-width:560px;background-color:#ffffff;border:1px solid #dfe4ec;border-radius:6px;">

          <tr>
            <td class="px" style="padding:24px 32px;border-bottom:1px solid #eef1f5;">
              <span style="font-size:16px;font-weight:600;letter-spacing:-0.01em;color:#0c3a2c;">SniffCampaign</span>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:36px 32px 32px 32px;font-size:14px;line-height:1.55;color:#1d2433;">
              ${body}
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:20px 32px 28px 32px;border-top:1px solid #eef1f5;background-color:#fafbfc;border-bottom-left-radius:6px;border-bottom-right-radius:6px;">
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:#6b7280;">${footerNote}</p>
              <p style="margin:0;font-size:11px;line-height:1.6;">
                <a href="${appUrl}/privacy" style="color:#6b7280;text-decoration:none;">Privacy</a>
                <span style="color:#d1d5db;"> · </span>
                <a href="${appUrl}/terms" style="color:#6b7280;text-decoration:none;">Terms</a>
                <span style="color:#d1d5db;"> · </span>
                <a href="${appUrl}/contact" style="color:#6b7280;text-decoration:none;">Contact</a>
              </p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#9ca3af;">
                © 2026 SniffCampaign · sniffcampaign.com
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/* ─── Reusable building blocks ─── */

export const greeting = (name: string) => `
  <p style="margin:0 0 20px 0;font-size:15px;color:#1d2433;">
    Hi <strong style="color:#0c3a2c;">${name}</strong>,
  </p>
`;

export const paragraph = (text: string) => `
  <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4a5260;">${text}</p>
`;

export const button = (label: string, href: string) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:6px;background-color:#115e44;">
        <a href="${href}" style="display:inline-block;padding:11px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

export const codeBlock = (
  code: string,
  expiresInMinutes: number,
  label: string = 'Verification code',
) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#f3f6f4;border:1px solid #d8e2dd;border-radius:6px;padding:24px;text-align:center;">
        <p style="margin:0 0 8px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;font-weight:600;">${label}</p>
        <p style="margin:0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:30px;font-weight:600;letter-spacing:0.18em;color:#0c3a2c;">${code}</p>
        <p style="margin:8px 0 0 0;font-size:12px;color:#6b7280;">Expires in ${expiresInMinutes} minutes</p>
      </td>
    </tr>
  </table>
`;

export const note = (text: string) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:#f7f9fb;border-left:3px solid #115e44;padding:14px 16px;border-radius:0 4px 4px 0;">
        <p style="margin:0;font-size:13px;line-height:1.55;color:#4a5260;">${text}</p>
      </td>
    </tr>
  </table>
`;

export const divider = () => `
  <div style="height:1px;background-color:#eef1f5;margin:28px 0;line-height:1px;font-size:1px;">&nbsp;</div>
`;

export const supportLine = () => `
  <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;text-align:center;">
    Questions? Email <a href="mailto:support@sniffcampaign.com" style="color:#115e44;text-decoration:none;">support@sniffcampaign.com</a>
  </p>
`;
