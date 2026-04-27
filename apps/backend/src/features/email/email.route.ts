// apps/backend/src/features/email/email.route.ts
import { Router } from 'express';
import { EmailController } from './email.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { sendEmailSchema } from './email.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const emailController = new EmailController();

router.post('/send', validateRequest(sendEmailSchema), catchAsync(emailController.sendEmail));

export default router;
