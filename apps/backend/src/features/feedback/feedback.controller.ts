// apps/backend/src/features/feedback/feedback.controller.ts
import { Request, Response } from 'express';
import { FeedbackService } from './feedback.service';

const feedbackService = new FeedbackService();

export class FeedbackController {
  submitFeedback = async (req: Request, res: Response) => {
    const feedback = await feedbackService.submitFeedback(req.body);
    res.status(201).json({ status: 'success', data: { feedback } });
  };
}
