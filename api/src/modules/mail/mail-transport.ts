import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface ResolvedMail {
  transporter: Transporter;
  /** RFC5322 From header, e.g. `"TableTab" <info@tabletab.co>`. */
  from: string;
}

/**
 * Build an SMTP transporter + From line from the admin's Settings → Mail (the
 * `mail` settings group). This is the single source of mail configuration —
 * there is no `.env` fallback; configure delivery in the admin settings.
 */
export function buildMailTransport(mail: Record<string, string>): ResolvedMail {
  const port = Number(mail.mail_port) || 587;
  // "ssl" → implicit TLS (port 465); "tls"/blank → STARTTLS.
  const secure =
    (mail.mail_encryption || '').toLowerCase() === 'ssl' || port === 465;

  const transporter = nodemailer.createTransport({
    host: mail.mail_host,
    port,
    secure,
    auth: { user: mail.mail_username, pass: mail.mail_password },
  });

  const fromEmail = mail.mail_from_email || 'noreply@example.com';
  const from = mail.mail_from_name
    ? `"${mail.mail_from_name}" <${fromEmail}>`
    : fromEmail;

  return { transporter, from };
}
