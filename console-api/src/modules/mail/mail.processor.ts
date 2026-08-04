import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { WelcomeNewCustomerTemplate } from './templates/welcome-email.template';
import { PasswordResetCodeTemplate } from './templates/password-reset-email.template';
import { EmailVerificationCodeTemplate } from './templates/email-verification.template';
import { EmailVerificationSuccessTemplate } from './templates/email-verification-success.template';
import { PasswordResetSuccessTemplate } from './templates/password-reset-success.template';

export interface WelcomeEmailJob {
  email: string;
  name: string;
}

export interface PasswordResetCodeJob {
  email: string;
  code: string;
  expiresInMinutes: number;
}

export interface PasswordResetSuccessJob {
  email: string;
  name: string;
}

export interface VerificationCodeJob {
  email: string;
  code: string;
  expiresInMinutes: number;
}

export interface VerificationSuccessJob {
  email: string;
  name: string;
}

export interface CustomEmailJob {
  email: string;
  subject: string;
  html: string;
}

@Processor('mail')
@Injectable()
export class MailProcessor {
  private transporter: Transporter;
  private appUrl: string;
  private mailFrom: string;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.appUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    this.mailFrom = this.configService.get('MAIL_FROM', 'noreply@esyncnsecure.com');
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    this.transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: false,
      auth: {
        user: user,
        pass: pass,
      },
    });
  }

  @Process('welcome-email')
  async handleWelcomeEmail(job: Job<WelcomeEmailJob>) {
    const { email, name } = job.data;
    const html = WelcomeNewCustomerTemplate(name, this.appUrl);

    const mailOptions = {
      from: this.mailFrom,
      to: email,
      subject: `Welcome to our app, ${name}!`,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`[QUEUE] Welcome email sent to ${email}. Message ID: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error(`[QUEUE] Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }

  @Process('password-reset-code')
  async handlePasswordResetCode(job: Job<PasswordResetCodeJob>) {
    const { email, code, expiresInMinutes } = job.data;
    const html = PasswordResetCodeTemplate(
      email.split('@')[0],
      code,
      expiresInMinutes,
      this.appUrl,
    );

    const mailOptions = {
      from: this.mailFrom,
      to: email,
      subject: 'Password Reset Code - Action Required',
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`[QUEUE] Password reset code sent to ${email}. Message ID: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error(`[QUEUE] Failed to send password reset code to ${email}:`, error);
      throw error;
    }
  }

  @Process('password-reset-success')
  async handlePasswordResetSuccess(job: Job<PasswordResetSuccessJob>) {
    const { email, name } = job.data;
    const html = PasswordResetSuccessTemplate(name, this.appUrl);

    const mailOptions = {
      from: this.mailFrom,
      to: email,
      subject: 'Password Reset Successfully',
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        `[QUEUE] Password reset success email sent to ${email}. Message ID: ${result.messageId}`,
      );
      return result;
    } catch (error) {
      console.error(`[QUEUE] Failed to send password reset success email to ${email}:`, error);
      throw error;
    }
  }

  @Process('verification-code')
  async handleVerificationCode(job: Job<VerificationCodeJob>) {
    const { email, code, expiresInMinutes } = job.data;
    const html = EmailVerificationCodeTemplate(
      email.split('@')[0],
      code,
      expiresInMinutes,
      this.appUrl,
    );

    const mailOptions = {
      from: this.mailFrom,
      to: email,
      subject: 'Verify Your Email Address - Code Inside',
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`[QUEUE] Verification code sent to ${email}. Message ID: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error(`[QUEUE] Failed to send verification code to ${email}:`, error);
      throw error;
    }
  }

  @Process('verification-success')
  async handleVerificationSuccess(job: Job<VerificationSuccessJob>) {
    const { email, name } = job.data;
    const html = EmailVerificationSuccessTemplate(name, this.appUrl);

    const mailOptions = {
      from: this.mailFrom,
      to: email,
      subject: 'Email Verified Successfully - Account Activated',
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        `[QUEUE] Verification success email sent to ${email}. Message ID: ${result.messageId}`,
      );
      return result;
    } catch (error) {
      console.error(`[QUEUE] Failed to send verification success email to ${email}:`, error);
      throw error;
    }
  }

  @Process('custom-email')
  async handleCustomEmail(job: Job<CustomEmailJob>) {
    const { email, subject, html } = job.data;

    const mailOptions = {
      from: this.mailFrom,
      to: email,
      subject,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`[QUEUE] Custom email sent to ${email}. Message ID: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error(`[QUEUE] Failed to send custom email to ${email}:`, error);
      throw error;
    }
  }
}
