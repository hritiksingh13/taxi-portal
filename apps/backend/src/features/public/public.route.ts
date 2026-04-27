// apps/backend/src/features/public/public.route.ts
import { Router, Request, Response } from 'express';
import { TripService } from '../trips/trip.service';
import { FeedbackController } from '../feedback/feedback.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { createFeedbackSchema } from '../feedback/feedback.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const tripService = new TripService();
const feedbackController = new FeedbackController();

// Public: Get trip by shareable token (no auth)
router.get(
  '/trip/:shareToken',
  catchAsync(async (req: Request, res: Response) => {
    const trip = await tripService.getTripByShareToken(req.params.shareToken);
    res.status(200).json({ status: 'success', data: { trip } });
  })
);

// Public: Submit feedback (no auth)
router.post(
  '/feedback',
  validateRequest(createFeedbackSchema),
  catchAsync(feedbackController.submitFeedback)
);

export default router;
