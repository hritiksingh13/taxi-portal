// apps/backend/src/features/email/email.dto.ts
import { z } from 'zod';

export const sendEmailSchema = z.object({
  body: z.object({
    to: z.union([
      z.string().email('Invalid email address'),
      z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient required'),
    ]),
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(1, 'Email body is required'),
  }),
});
