// apps/backend/src/features/trips/trip.dto.ts
import { z } from 'zod';

export const initiateTripSchema = z.object({
  body: z.object({
    driverId: z.string().uuid('Invalid Driver ID'),
    agentId: z.string().uuid('Invalid Agent ID'),
    currentLocation: z.string().min(2, 'Current location is required'),
    destination: z.string().min(2, 'Destination is required'),
    estimatedDurationMinutes: z.number().positive('Duration must be a positive number'),
  }),
});

export const getTripSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Trip ID format') }),
});
