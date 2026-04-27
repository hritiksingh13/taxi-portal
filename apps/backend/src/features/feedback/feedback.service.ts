// apps/backend/src/features/feedback/feedback.service.ts
import { PrismaClient, Feedback } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';

const prisma = new PrismaClient();

export class FeedbackService {
  async submitFeedback(data: {
    stars: number;
    experience: string;
    reason?: string;
    shareToken: string;
  }): Promise<Feedback> {
    // Look up trip by share token
    const trip = await prisma.trip.findUnique({
      where: { shareToken: data.shareToken },
      include: { feedback: true },
    });

    if (!trip) throw new AppError('Trip not found. Invalid or expired link.', 404);
    if (trip.feedback) throw new AppError('Feedback has already been submitted for this trip.', 409);

    return await prisma.feedback.create({
      data: {
        stars: data.stars,
        experience: data.experience,
        reason: data.reason || null,
        tripId: trip.id,
      },
    });
  }

  async getFeedbackByTripId(tripId: string): Promise<Feedback | null> {
    return await prisma.feedback.findUnique({ where: { tripId } });
  }
}
