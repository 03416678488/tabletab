import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(
    @InjectQueue('mail') private mailQueue: Queue,
    private configService: ConfigService,
  ) {
    this.initializeTransporter();
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

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.mailQueue.add(
      'welcome-email',
      { email, name },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log(`[QUEUED] Welcome email for ${email}`);
  }

  async sendPasswordResetCode(
    email: string,
    code: string,
    expiresInMinutes: number = 15,
  ): Promise<void> {
    await this.mailQueue.add(
      'password-reset-code',
      { email, code, expiresInMinutes },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log(`[QUEUED] Password reset code for ${email}`);
  }

  async sendPasswordResetSuccessEmail(email: string, name: string): Promise<void> {
    await this.mailQueue.add(
      'password-reset-success',
      { email, name },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log(`[QUEUED] Password reset success email for ${email}`);
  }

  async sendVerificationCode(
    email: string,
    code: string,
    expiresInMinutes: number = 15,
  ): Promise<void> {
    await this.mailQueue.add(
      'verification-code',
      { email, code, expiresInMinutes },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log(`[QUEUED] Verification code for ${email}`);
  }

  async sendVerificationSuccessEmail(email: string, name: string): Promise<void> {
    await this.mailQueue.add(
      'verification-success',
      { email, name },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log(`[QUEUED] Verification success email for ${email}`);
  }

  async sendCustomEmail(email: string, subject: string, html: string): Promise<void> {
    await this.mailQueue.add(
      'custom-email',
      { email, subject, html },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log(`[QUEUED] Custom email for ${email}`);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('Failed to verify email service:', error);
      return false;
    }
  }

  // Queue management methods
  async getQueueStats() {
    const waiting = await this.mailQueue.getWaitingCount();
    const active = await this.mailQueue.getActiveCount();
    const completed = await this.mailQueue.getCompletedCount();
    const failed = await this.mailQueue.getFailedCount();
    const delayed = await this.mailQueue.getDelayedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async getFailedJobs(limit: number = 10) {
    return await this.mailQueue.getFailed(0, limit);
  }

  async retryFailedJob(jobId: string) {
    const job = await this.mailQueue.getJob(jobId);
    if (job) {
      await job.retry();
      return true;
    }
    return false;
  }

  async clearQueue() {
    await this.mailQueue.empty();
    return true;
  }
}
