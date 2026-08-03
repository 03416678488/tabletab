export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
}

export interface MailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface PasswordResetEmailData {
  firstName: string;
  resetLink: string;
  expiryHours: number;
}

export interface WelcomeEmailData {
  firstName: string;
  loginUrl: string;
  verificationLink?: string;
}

export interface VerificationEmailData {
  firstName: string;
  verificationLink: string;
  expiryHours: number;
}

export interface GenericEmailData {
  firstName: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
}
