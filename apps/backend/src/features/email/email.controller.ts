// apps/backend/src/features/email/email.controller.ts
import { Request, Response } from 'express';
import { EmailService } from './email.service';

const emailService = new EmailService();

export class EmailController {
  sendEmail = async (req: Request, res: Response) => {
    await emailService.sendEmail(req.body);
    res.status(200).json({ status: 'success', message: 'Email sent successfully' });
  };
}
