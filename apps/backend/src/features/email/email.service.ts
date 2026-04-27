// apps/backend/src/features/email/email.service.ts
import nodemailer from 'nodemailer';
import { env } from '../../config/env.config';
import { AppError } from '../../core/exceptions/global.exception';

let transporter: nodemailer.Transporter | null = null;

// Only create transporter if SMTP credentials are configured
if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export class EmailService {
  async sendEmail(data: {
    to: string | string[];
    subject: string;
    body: string;
  }): Promise<void> {
    if (!transporter) {
      throw new AppError(
        'Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env file.',
        503
      );
    }

    const recipients = Array.isArray(data.to) ? data.to.join(', ') : data.to;

    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: recipients,
      subject: data.subject,
      html: data.body,
    });
  }
}
