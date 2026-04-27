// apps/backend/src/features/feedback/feedback.dto.ts
import { z } from 'zod';

export const createFeedbackSchema = z.object({
  body: z.object({
    stars: z.number().int().min(1, 'Minimum 1 star').max(5, 'Maximum 5 stars'),
    experience: z.string().min(3, 'Please describe your experience'),
    reason: z.string().optional(),
    shareToken: z.string().min(1, 'Share token is required'),
  }),
});
